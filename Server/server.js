// Remage/Server/server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import helmet from 'helmet'; // Add basic security headers
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet()); // Add security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded/generated images

// Connect to MongoDB
const connectDatabase = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit on database connection failure
  }
};
connectDatabase();

// Routes
app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);

// Health check endpoint
app.get('/', (req, res) => res.send('API Working fine shh'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Production configuration
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'Client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Client/dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
