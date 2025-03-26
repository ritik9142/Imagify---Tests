import userModel from "../models/userModel.js";
import { InferenceClient } from "@huggingface/inference";

export const generateImage = async (req, res) => {
    try {
        const { userID, prompt } = req.body; // Match the middleware field name

        const user = await userModel.findById(userID);

        if (!user || !prompt || prompt.trim() === "") {
            return res.json({ success: false, message: 'Missing Details' });
        }

        if (user.creditBalance <= 0) {
            return res.json({ success: false, message: 'No Credit Balance', creditBalance: user.creditBalance });
        }

        // Ensure Hugging Face tokens are present
        if (!process.env.HF_TOKENS) {
            return res.json({ success: false, message: 'HF_TOKENS environment variable is missing' });
        }

        // Process tokens from environment variable
        const tokens = process.env.HF_TOKENS.split(",")
            .map(token => token.trim())
            .filter(token => token.length > 0);
        if (tokens.length === 0) {
            return res.json({ success: false, message: 'No valid Hugging Face tokens provided in HF_TOKENS.' });
        }

        // Generate a random seed number to ensure varied outputs for the same prompt
        const seed = Math.floor(Math.random() * 1000000);

        let imageBuffer;
        let successFlag = false;
        // Attempt each token sequentially until one works
        for (const token of tokens) {
            try {
                const client = new InferenceClient(token);
                // Generate the image using the Hugging Face textToImage API with random seed
                const imageBlob = await client.textToImage({
                    model: "black-forest-labs/FLUX.1-schnell",
                    inputs: prompt,
                    parameters: {
                        num_inference_steps: 10,
                        seed: seed
                    }
                });
                // Convert Blob to ArrayBuffer, then to Buffer
                const arrayBuffer = await imageBlob.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
                successFlag = true;
                break; // Exit loop on success
            } catch (error) {
                console.error(`Error with token ${token.substring(0, 5)}...:`, error.message);
            }
        }

        if (!successFlag) {
            throw new Error("All provided tokens failed to generate the image. Please verify your tokens and account permissions.");
        }

        const base64Image = imageBuffer.toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;

        // Update credit balance
        const updatedUser = await userModel.findByIdAndUpdate(
            user._id,
            { creditBalance: user.creditBalance - 1 },
            { new: true } // Return the updated document
        );

        res.json({
            success: true,
            message: "Image Generated",
            creditBalance: updatedUser.creditBalance,
            resultImage,
        });

    } catch (error) {
        console.error("Error in generateImage:", error.message);
        res.json({ success: false, message: error.message });
    }
};
