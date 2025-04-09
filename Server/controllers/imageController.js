// Remage/Server/controllers/ImageController.js
import userModel from "../models/userModel.js";
import { HfInference } from "@huggingface/inference";
import multer from "multer";
import { checkForBannedWords } from '../utils/contentModeration.js';

// Configure Multer for memory storage
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: "structure_image", maxCount: 1 },
  { name: "style_image", maxCount: 1 },
]);

export const generateImage = async (req, res) => {
  try {
    const userID = req.body.userID || req.body.userId;
    const { prompt } = req.body;

    // Validate userID
    if (!userID || userID === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Valid prompt is required.",
      });
    }

    // Check for banned words
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

    // Check credit balance
    if (user.creditBalance <= 0) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits",
        creditBalance: user.creditBalance,
      });
    }

    // Load API tokens from environment variables
    const tokens = [];
    let i = 1;
    while (true) {
      const token = process.env[`HF_TOKEN${i}`];
      if (!token || typeof token !== "string" || token.trim() === "") break;
      tokens.push(token.trim());
      i++;
    }
    if (tokens.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: No API tokens found.",
      });
    }
    console.log("Loaded tokens:", tokens.map(t => t.substring(0, 5) + "..."));

    // Shuffle tokens to distribute load
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    shuffle(tokens);

    const seed = Math.floor(Math.random() * 1000000);
    let imageBuffer;
    let successFlag = false;

    // Attempt image generation with available tokens
    for (const token of tokens) {
      try {
        const client = new HfInference(token);
        const imageBlob = await client.textToImage({
          model: "black-forest-labs/FLUX.1-dev",
          inputs: prompt,
          parameters: {
            num_inference_steps: 25,
            guidance_scale: 7.5,
            seed: seed,
          },
        });
        const arrayBuffer = await imageBlob.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        successFlag = true;
        break;
      } catch (error) {
        console.error(`Text-to-Image failed with token ${token.substring(0, 5)}...:`, error.message);
      }
    }

    if (!successFlag) {
      return res.status(503).json({
        success: false,
        message: "Failed to generate image. Please try again later.",
      });
    }

    // Convert image to base64
    const base64Image = imageBuffer.toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    // Deduct one credit from the user
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      { $inc: { creditBalance: -1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Image generated successfully",
      creditBalance: updatedUser.creditBalance,
      resultImage,
    });
  } catch (error) {
    console.error("Error in generateImage:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
