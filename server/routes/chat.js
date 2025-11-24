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
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.0-flash (available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash)
    // gemini-2.0-flash is more stable and less likely to be overloaded
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    console.log('Initializing Gemini model:', modelName);
    model = genAI.getGenerativeModel({
      model: modelName
    });
    console.log('Gemini model initialized successfully');
  } catch (err) {
    console.error('Error initializing Gemini client:', err);
  }
} else {
  console.error('GEMINI_API_KEY is not set. /api/chat will return errors until it is configured.');
}


// ... (rest of your file is fine)
router.get("/", (req, res) => res.send("Welcome to Gemini API v1"));

router.post("/", CheckUser, async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt) {
    return res.status(400).json({ status: 400, message: "Prompt is required" });
  }

  try {
    console.log('POST /api/chat - userId:', userId, 'prompt length:', (prompt || '').length);
    if (!process.env.GEMINI_API_KEY || !model) {
      console.error('Rejecting request: GEMINI_API_KEY not configured or model not initialized');
      return res.status(500).json({ status: 500, message: 'Server misconfiguration: GEMINI_API_KEY missing' });
    }
    // Generate content using Gemini API with brief bullet point response instruction
    console.log('Calling Gemini API with prompt:', prompt.substring(0, 50) + '...');
    
    // Add instruction for brief overview with bullet points
    const briefPrompt = `Please provide a brief overview and a few concise bullet points related to the question. Keep it simple and to the point. Format your answer with bullet points (•) or dashes (-). ${prompt}`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: briefPrompt }] }],
      generationConfig: {
        maxOutputTokens: 1500, // Moderate length for brief overview
        temperature: 0.7,
      }
    });
    console.log('Gemini API response received');
    
    // Extract text from Gemini API response
    let text = null;
    try {
      const response = result.response;
      if (response && typeof response.text === 'function') {
        text = response.text().trim();
        console.log('Text extracted successfully, length:', text.length);
      } else {
        throw new Error('response.text is not a function');
      }
    } catch (e) {
      console.error('Error extracting text from response:', e);
      console.error('Response structure:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Fallback: try alternative response structure
      if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = result.response.candidates[0].content.parts[0].text.trim();
        console.log('Text extracted via fallback method');
      } else if (result?.response?.text) {
        // Sometimes text is directly available
        text = String(result.response.text).trim();
        console.log('Text extracted directly from response.text');
      } else {
        console.error('No text found in response. Full result:', JSON.stringify(result, null, 2));
        return res.status(502).json({ status: 502, message: "Empty response from model", details: "Could not extract text from API response" });
      }
    }

    if (!text) {
      console.error('No text returned from model:', { result });
      return res.status(502).json({ status: 502, message: "Empty response from model" });
    }

    // Save to database
    let saved = null;
    try {
      saved = await chat.newResponse(prompt, { gemini: text }, userId);
    } catch (dbError) {
      console.error("Database Error:", dbError);
      // Even if DB save fails, return the response to user
      return res.status(200).json({
        status: 200,
        message: "Success (response not saved)",
        data: { _id: null, content: text },
        warning: "Response generated but could not be saved to database"
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Success",
      data: { _id: saved?.chatId || null, content: text },
    });
  } catch (err) {
    console.error("Chat Route Error:", err);
    console.error("Error Stack:", err?.stack);
    console.error("Error Message:", err?.message);
    // provide more detail to client while developing; remove details in production
    return res.status(500).json({ 
      status: 500, 
      message: "Chat API error", 
      error: err?.message || String(err),
      details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
});

router.put("/", CheckUser, async (req, res) => {
  const { prompt, userId, chatId } = req.body;
  if (!prompt || !chatId) {
    return res.status(400).json({ status: 400, message: "Prompt and chatId are required" });
  }

  try {
    if (!model) {
      return res.status(500).json({ status: 500, message: 'Server misconfiguration: Model not initialized' });
    }
    
    // Add instruction for brief overview with bullet points
    const briefPrompt = `Please provide a brief overview and a few concise bullet points related to the question. Keep it simple and to the point. Format your answer with bullet points (•) or dashes (-). ${prompt}`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: briefPrompt }] }],
      generationConfig: {
        maxOutputTokens: 1500, // Moderate length for brief overview
        temperature: 0.7,
      }
    });

    let text = null;
    try {
      const response = result.response;
      text = response.text().trim();
    } catch (e) {
      console.error('Error extracting text from response:', e);
      // Fallback: try alternative response structure
      if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = result.response.candidates[0].content.parts[0].text.trim();
      } else {
        return res.status(502).json({ status: 502, message: "Empty response from model" });
      }
    }
    
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

router.get("/saved", CheckUser, async (req, res) => {
  const { chatId, userId } = req.query;
  if (!chatId) {
    return res.status(400).json({ status: 400, message: "chatId is required" });
  }
  try {
    const chatData = await chat.getChat(userId, chatId);
    return res.status(200).json({ status: 200, message: "Success", data: chatData });
  } catch (err) {
    if (err?.status === 404) {
      return res.status(404).json({ status: 404, message: "Chat not found" });
    }
    console.error("Get Chat Error:", err?.message || err);
    return res.status(500).json({ status: 500, message: "Error fetching chat" });
  }
});

router.delete("/all", CheckUser, async (req, res) => {
  const { userId } = req.query;
  try {
    await chat.deleteAllChat(userId);
    return res.status(200).json({ status: 200, message: "Success" });
  } catch (err) {
    console.error("Delete All Chats Error:", err?.message || err);
    return res.status(500).json({ status: 500, message: "Error deleting chats" });
  }
});

export default router;