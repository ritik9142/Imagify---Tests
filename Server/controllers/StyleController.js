import { Client } from '@gradio/client';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import userModel from "../models/userModel.js";
import dotenv from 'dotenv';
import axios from 'axios';
import { checkForBannedWords } from '../utils/contentModeration.js';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp'; // Added Sharp import

dotenv.config();

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log('Uploads directory is ready'))
  .catch(err => console.error('Error creating uploads directory:', err));

const visionClient = new ImageAnnotatorClient();  

// Configure Multer (unchanged)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (mimeType && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, JPG, and PNG files are allowed!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadMiddleware = upload.fields([
  { name: 'structure_image', maxCount: 1 },
  { name: 'style_image', maxCount: 1 },
]);

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Image processing helper function
const processImage = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width > 1024 || metadata.height > 1024) {
      return await sharp(buffer).resize({ width: 1024, height: 1024, fit: 'inside' }).toBuffer();
    }
    return buffer;
  } catch (error) {
    throw new Error('Invalid image file');
  }
};

export const generateImageToImage = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    const userID = req.user?.id;
    if (!userID) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required. Ensure you are authenticated.",
      });
    }

    const { prompt, depth_strength, style_strength } = req.body;
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }
    if (!req.files || !req.files['structure_image'] || !req.files['structure_image'][0]) {
      return res.status(400).json({
        success: false,
        message: "Structure image is required.",
      });
    }

    const { hasBannedWords, bannedWordsFound } = checkForBannedWords(prompt);
    if (hasBannedWords) {
      console.log(`Blocked request from user ${userID} with prompt: "${prompt}" | Banned words: ${bannedWordsFound.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Prompt contains banned words: ${bannedWordsFound.join(', ')}`,
      });
    }

    const user = await userModel.findById(userID);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.creditBalance <= 0) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits",
        creditBalance: user.creditBalance,
      });
    }

    const structureFile = req.files['structure_image'][0];
    const styleFile = req.files['style_image'] ? req.files['style_image'][0] : null;

    // Read and process image buffers
    const structureBuffer = await fs.readFile(structureFile.path);
    let finalStructureBuffer;
    try {
      finalStructureBuffer = await processImage(structureBuffer);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid structure image' });
    }

    let finalStyleBuffer = null;
    if (styleFile) {
      const styleBuffer = await fs.readFile(styleFile.path);
      try {
        finalStyleBuffer = await processImage(styleBuffer);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid style image' });
      }
    }

    // Clean up temporary files
    await Promise.all([
      fs.unlink(structureFile.path),
      styleFile ? fs.unlink(styleFile.path) : Promise.resolve(),
    ]).catch((err) => console.warn('Cleanup failed:', err));

    const depthStrength = parseFloat(depth_strength) || 20;
    const styleStrength = parseFloat(style_strength) || 0.5;

    const tokens = [];
    let i = 1;
    while (process.env[`HF_TOKEN${i}`]) {
      const token = process.env[`HF_TOKEN${i}`].trim();
      if (token && typeof token === "string") tokens.push(token);
      i++;
    }
    if (tokens.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: No valid API tokens found.",
      });
    }
    console.log("Loaded tokens:", tokens.map(t => t.substring(0, 5) + "..."));

    const shuffledTokens = shuffleArray([...tokens]);

    let generatedResult;
    let successFlag = false;

    for (const token of shuffledTokens) {
      try {
        const client = await Client.connect("multimodalart/flux-style-shaping", {
          hf_token: token,
        });
        const result = await client.predict("/generate_image", {
          prompt,
          structure_image: finalStructureBuffer,
          style_image: finalStyleBuffer,
          depth_strength: depthStrength,
          style_strength: styleStrength,
        });
        console.log('API result:', result);
        if (!result.data || result.data.length === 0) {
          throw new Error('API returned no data');
        }
        const generated = result.data[0];
        generatedResult = generated.url || generated;
        successFlag = true;
        break;
      } catch (error) {
        console.error(`Failed with token ${token.substring(0, 5)}...:`, error.message);
      }
    }

    if (!successFlag) {
      return res.status(503).json({
        success: false,
        message: "Failed to generate image. Please try again later.",
        details: "All API tokens failed. Check Gradio space availability.",
      });
    }

    if (typeof generatedResult !== 'string' || !generatedResult.startsWith('http')) {
      console.error('Invalid generated result:', generatedResult);
      return res.status(500).json({
        success: false,
        message: "Invalid image URL returned from the API.",
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      { $inc: { creditBalance: -1 } },
      { new: true }
    );

    let resultImage;
    try {
      const imageResponse = await axios.get(generatedResult, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
      const base64Image = imageBuffer.toString('base64');
      const contentType = imageResponse.headers['content-type'] || 'image/png';
      resultImage = `data:${contentType};base64,${base64Image}`;
    } catch (downloadError) {
      console.error('Failed to download generated image:', downloadError.message);
      return res.status(500).json({
        success: false,
        message: "Image generated but failed to retrieve. Credit has been deducted.",
        creditBalance: updatedUser.creditBalance,
      });
    }

    res.status(200).json({
      success: true,
      message: "Image generated successfully",
      creditBalance: updatedUser.creditBalance,
      resultImage: resultImage,
      filename: "KrutiShu Download.png",
    });
  } catch (error) {
    console.error("Error in generateImageToImage:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
