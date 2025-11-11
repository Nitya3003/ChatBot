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
let port = process.env.PORT;

// --- FIX 1: Get the current directory path ---
// This resolves to the 'server' folder
const __dirname = path.resolve(path.dirname(''));

// --- FIX 2: Point express.static to the parent's dist folder ---
// We go up one level ('..') to find the correct 'dist'
app.use(express.static(path.join(__dirname, '../dist')));

app.use(cors({ credentials: true, origin: process.env.SITE_URL }));
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

    app.listen(port, () => {
        console.log("server started");
    });
});