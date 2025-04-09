// Remage/Server/controllers/StyleController.js
import { Client } from '@gradio/client';
import multer from 'multer';
import fs from 'fs/promises'; // Use promises for async file operations
import path from 'path';
import userModel from "../models/userModel.js";
import dotenv from 'dotenv';
import axios from 'axios'; // Added for downloading images
import { checkForBannedWords } from '../utils/contentModeration.js';

dotenv.config();

// Configure Multer for disk storage with validation
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadMiddleware = upload.fields([
  { name: 'structure_image', maxCount: 1 },
  { name: 'style_image', maxCount: 1 },
]);

/**
 * Shuffles array in place using Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate an image-to-image output using Gradio client.
 * Expects:
 *  - req.user.id (set by auth middleware)
 *  - req.body.prompt, depth_strength, style_strength
 *  - Files: structure_image (required), style_image (optional)
 */
export const generateImageToImage = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Extract user ID from req.user (set by auth middleware)
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

    // Fetch user from database
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

    // Extract uploaded files
    const structureFile = req.files['structure_image'][0];
    const styleFile = req.files['style_image'] ? req.files['style_image'][0] : null;

    // Read file buffers asynchronously
    const [structureImage, styleImage] = await Promise.all([
      fs.readFile(structureFile.path),
      styleFile ? fs.readFile(styleFile.path) : null,
    ]);

    // Clean up temporary files
    await Promise.all([
      fs.unlink(structureFile.path),
      styleFile ? fs.unlink(styleFile.path) : Promise.resolve(),
    ]).catch((err) => console.warn('Cleanup failed:', err));

    // Parse strength parameters with defaults
    const depthStrength = parseFloat(depth_strength) || 20;
    const styleStrength = parseFloat(style_strength) || 0.5;

    // Load and validate API tokens from environment variables
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

    // Shuffle tokens to randomize order for this request
    const shuffledTokens = shuffleArray([...tokens]);

    let generatedResult;
    let successFlag = false;

    // Try each token in shuffled order until successful
    for (const token of shuffledTokens) {
      try {
        const client = await Client.connect("multimodalart/flux-style-shaping", {
          hf_token: token,
        });
        const result = await client.predict("/generate_image", {
          prompt,
          structure_image: structureImage,
          style_image: styleImage,
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

    // Check if generatedResult is a valid URL
    if (typeof generatedResult !== 'string' || !generatedResult.startsWith('http')) {
      console.error('Invalid generated result:', generatedResult);
      return res.status(500).json({
        success: false,
        message: "Invalid image URL returned from the API.",
      });
    }

    // Deduct one credit
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      { $inc: { creditBalance: -1 } },
      { new: true }
    );

    // Download the generated image
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

    // Send the response with base64 image and custom filename
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
