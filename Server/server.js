import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import path from 'path';

import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'


const __dirname = path.resolve();






const PORT = process.env.PORT || 4000;
const app = express()


app.use(express.json())
app.use(cors())
await connectDB()

app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)
app.get('/', (req, res)=> res.send("API Working fine shh "))

app.listen(PORT, ()=> console.log('Server running on port ' + PORT ));

if (process.env.NODE_ENV === 'production') {
    // Serve static frontend
    app.use(express.static(path.join(__dirname, 'Client/dist')));
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'Client/dist', 'index.html'));
    });
  }

