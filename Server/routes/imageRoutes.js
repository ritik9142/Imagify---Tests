import express from 'express';
import { generateImage } from '../controllers/imageController.js';
import userAuth from '../middlewares/auth.js';

const imageRouter = express.Router();

// Corrected HTTP method name to 'post'
imageRouter.post('/generate-image', userAuth, generateImage);

export default imageRouter;
