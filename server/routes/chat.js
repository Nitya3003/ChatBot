import { Router } from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
// ... (rest of your imports are fine)
import user from "../helpers/user.js";
import jwt from "jsonwebtoken";
import chat from "../helpers/chat.js";

dotenv.config();
const router = Router();

// ... (Your CheckUser middleware is fine)
const CheckUser = async (req, res, next) => {
  jwt.verify(req.cookies?.userToken, process.env.JWT_SECRET, async (err, decoded) => {
    if (!decoded) return res.status(401).json({ status: 401, message: "Not Logged" });
    try {
      const userData = await user.checkUserFound(decoded);
      req.body.userId = userData._id;
      req.query.userId = userData._id; 
      next();
    } catch (e) {
      if (e?.notExists) {
        res.clearCookie("userToken").status(401).json({ status: 401, message: e?.text });
      } else {
        res.status(500).json({ status: 500, message: e });
      }
    }
  });
};

// --- INITIALIZE THE GEMINI CLIENT ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest"
});


// ... (rest of your file is fine)
router.get("/", (req, res) => res.send("Welcome to Gemini API v1"));

router.post("/", CheckUser, async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt) {
    return res.status(400).json({ status: 400, message: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (!text) return res.status(502).json({ status: 502, message: "Empty response from model" });

    const saved = await chat.newResponse(prompt, { gemini: text }, userId);
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: { _id: saved.chatId, content: text },
    });
  } catch (err) {
    console.error("Gemini API Error:", err?.message || err);
    return res.status(500).json({ status: 500, message: "Gemini API error" });
  }
});

router.put("/", CheckUser, async (req, res) => {
  const { prompt, userId, chatId } = req.body;
  if (!prompt || !chatId) {
    return res.status(400).json({ status: 400, message: "Prompt and chatId are required" });
  }

  try {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    const text = result.response.text().trim();
    if (!text) return res.status(502).json({ status: 502, message: "Empty response from model" });

    await chat.updateChat(chatId, prompt, { gemini: text }, userId);
    return res.status(200).json({ status: 200, message: "Success", data: { content: text } });
  } catch (err) {
    console.error("Gemini API Error:", err?.message || err);
    return res.status(500).json({ status: 500, message: "Gemini API error" });
  }
});

router.get("/history", CheckUser, async (req, res) => {
  const { userId } = req.query;
  try {
    const historyData = await chat.getHistory(userId);
    return res.status(200).json({ status: 200, message: "Success", data: historyData });
  } catch (err) {
    console.error("Get History Error:", err?.message || err);
    return res.status(500).json({ status: 500, message: "Error fetching history" });
  }
});

export default router;