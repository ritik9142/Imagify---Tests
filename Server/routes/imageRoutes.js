// Remage/Server/routes/imageRoutes.js
import express from 'express';
import { generateImage } from '../controllers/imageController.js';
import { generateImageToImage, uploadMiddleware as styleUploadMiddleware } from '../controllers/StyleController.js';
import userAuth from '../middlewares/auth.js';

const imageRouter = express.Router();

imageRouter.post('/generate-image', userAuth, generateImage);

imageRouter.post(
  '/generate-image-to-image',
  userAuth,
  styleUploadMiddleware,
  generateImageToImage
);

export default imageRouter;
