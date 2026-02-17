import { Router } from "express";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

import user from "../helpers/user.js";
import chat from "../helpers/chat.js";

dotenv.config();
const router = Router();

/* =========================
   AUTH MIDDLEWARE
========================= */
const CheckUser = async (req, res, next) => {
  const token = req.cookies?.userToken;

  if (!token) {
    return res.status(401).json({ status: 401, message: "Not Logged In" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).json({ status: 401, message: "Invalid Token" });
    }

    try {
      const userData = await user.checkUserFound(decoded);
      req.body.userId = userData._id;
      req.query.userId = userData._id;
      next();
    } catch {
      res.clearCookie("userToken");
      res.status(401).json({ status: 401, message: "Invalid User" });
    }
  });
};

/* =========================
   GEMINI INIT (FIXED)
========================= */
let model = null;

try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.0-pro",
  });
  console.log("Gemini initialized:", process.env.GEMINI_MODEL);
} catch (err) {
  console.error("Gemini init failed:", err.message);
}

/* =========================
   HELPERS
========================= */
const buildPrompt = (prompt) => `
Explain briefly using bullet points:

${prompt}
`;

const getGeminiResponse = async (prompt) => {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildPrompt(prompt) }] }],
  });

  return result.response.text();
};

/* =========================
   ROUTES
========================= */
router.get("/", (_, res) => res.send("Chat API v1"));

router.post("/", CheckUser, async (req, res) => {
  const { prompt, userId } = req.body;

  try {
    const text = await getGeminiResponse(prompt);

    const saved = await chat.newResponse(prompt, { gemini: text }, userId);

    res.status(200).json({
      status: 200,
      data: {
        _id: saved.chatId,
        content: text,
      },
    });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ status: 500, message: "Chat error" });
  }
});

router.get("/history", CheckUser, async (req, res) => {
  const data = await chat.getHistory(req.query.userId);
  res.json({ status: 200, data });
});

router.delete("/all", CheckUser, async (req, res) => {
  await chat.deleteAllChat(req.query.userId);
  res.json({ status: 200, message: "Deleted" });
});

export default router;
