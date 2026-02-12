// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize Gemini AI client (reads API key from GEMINI_API_KEY in .env)
const ai = new GoogleGenAI({});

app.post("/suggest", async (req, res) => {
  const { key, scale, selectedNotes } = req.body;

  try {
    const notesText = selectedNotes
      .map(n => `${n.note}(fret ${n.fret})`)
      .join(", ")
      .slice(0, 500);

    const prompt = `
      The user is exploring the ${key} key with ${scale} scale on a guitar.
      Currently selected notes: ${notesText}.
      Suggest educational content (tutorials, guides, websites) that help them learn about these concepts.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    res.json({ suggestions: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
