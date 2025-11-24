import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connection.js';
import ChatRoute from './routes/chat.js';
import UserRoute from './routes/user.js';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

let app = express();
let port = process.env.PORT || 5000;

// --- FIX 1: Get the current directory path ---
// This resolves to the 'server' folder
const __dirname = path.resolve(path.dirname(''));

// --- FIX 2: Point express.static to the parent's dist folder ---
// We go up one level ('..') to find the correct 'dist'
app.use(express.static(path.join(__dirname, '../dist')));

// Allow credentials and use SITE_URL if provided. During local development
// if SITE_URL is not set we reflect the request origin (origin: true) so
// the browser receives Access-Control-Allow-Origin matching the request and
// credentials can be sent. Be careful to tighten this in production.
const corsOptions = {
    credentials: true,
    origin: process.env.SITE_URL || true,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// api route
app.use('/api/chat/', ChatRoute);
app.use('/api/user/', UserRoute);

// --- FIX 3: Point the frontend route to the parent's dist/index.html ---
app.get('/*',(req,res)=>{
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

connectDB((err) => {
    if (err) return console.log("MongoDB Connect Failed : ", err);

    console.log("MongoDB Connected");

    const server = app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Error: Port ${port} is already in use.`);
            console.error(`Please either:`);
            console.error(`  1. Stop the process using port ${port}`);
            console.error(`  2. Or set a different PORT in your .env file\n`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
});