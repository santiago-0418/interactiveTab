import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://tab-app-nine.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { key, scale, selectedNotes } = req.body;

    // sanity check
    if (!key || !scale || !Array.isArray(selectedNotes)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const notesText = selectedNotes
      .map(n => `${n.note} (fret ${n.fret})`)
      .slice(0, 500)
      .join(", ");

    const prompt = `
You are an expert guitar tutor.

The user is exploring the ${key} key with the ${scale} scale on a guitar.
Currently selected notes: ${notesText}.

Provide at most 3 educational suggestions in JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(response.text);
    } catch (e) {
      suggestions = [
        { title: "AI Suggestion", source: "AI", link: "", description: response.text }
      ];
    }

    return res.status(200).json({ suggestions });

  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
