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
      .map(n => `${n.note} (fret ${n.fret})`)
      .join(", ")
      .slice(0, 500);

    const prompt = `
You are an expert guitar tutor.

The user is exploring the ${key} key with the ${scale} scale on a guitar.
Currently selected notes: ${notesText}.

Provide **at most 3 educational suggestions** that help the user learn:
- Guitar techniques related to these notes.
- Scales, chords, or theory concepts demonstrated by these notes.

For each suggestion, include:
1. **title** – a short descriptive title.
2. **source** – where it comes from (website, YouTube channel, author).
3. **link** – if applicable.
4. **description** – 1-2 sentences explaining why it’s useful.

Return the response as a **JSON array**, like this:

[
  { "title": "...", "source": "...", "link": "...", "description": "..." },
  ...
]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    // Parse AI JSON safely
    let suggestions = [];
    try {
      suggestions = JSON.parse(response.text);
    } catch (e) {
      console.warn("Failed to parse AI JSON:", e);
      // fallback: return raw text
      suggestions = [{ title: "AI Suggestion", source: "AI", link: "", description: response.text }];
    }

    res.json({ suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
