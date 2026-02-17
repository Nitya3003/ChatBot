import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

import { connectDB } from "./db/connection.js";
import ChatRoute from "./routes/chat.js";
import UserRoute from "./routes/user.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/chat", ChatRoute);
app.use("/api/user", UserRoute);

connectDB(() => {
  console.log("MongoDB Connected");
  app.listen(port, () => console.log("Server running on", port));
});
