import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUBMISSION_API_KEY = process.env.SUBMISSION_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function stripDataUrl(s) {
  const str = String(s || "");
  const idx = str.indexOf("base64,");
  return idx !== -1 ? str.slice(idx + 7) : str;
}

function extractJson(text) {
  const raw = String(text || "").trim();

  // Try direct parse
  try {
    return JSON.parse(raw);
  } catch {}

  // Try extracting first {...} block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const chunk = raw.slice(start, end + 1);
    return JSON.parse(chunk);
  }

  // No JSON found
  throw new Error("Invalid JSON");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  // Auth
  const key = req.headers["x-api-key"];
  if (!SUBMISSION_API_KEY || !key || key !== SUBMISSION_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing 'x-api-key' header.",
    });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server misconfigured",
      message: "GEMINI_API_KEY is not set in Vercel environment variables.",
    });
  }

  try {
    const { audio, language, mimeType } = req.body || {};
    if (!audio) {
      return res.status(400).json({
        error: "Missing 'audio'",
        message:
          "Send JSON body: { audio: <base64>, language: <string>, mimeType: <string optional> }",
      });
    }

    const base64Data = stripDataUrl(audio);
    const safeMime = mimeType || "audio/*";
    const lang = language || "English";

    // Optional: quick sanity check (helps avoid weird SDK failures)
    if (base64Data.length < 2000) {
      return res.status(400).json({
        error: "Audio too short / invalid",
        message:
          "Your base64 audio looks too small. Please send a real MP3/WAV/WEBM base64 (a few KB+).",
      });
    }

    const prompt = `
You are an Audio Forensics AI. Classify the input audio as either "AI_GENERATED" or "HUMAN".
Language: ${lang}

Return ONLY a valid JSON object (no markdown, no extra text) in this format:
{
  "classification": "AI_GENERATED" | "HUMAN",
  "confidence": 0.0-1.0,
  "explanation": "short technical explanation"
}
`.trim();

    // ✅ Do NOT force responseMimeType/schema (prevents SDK "Invalid JSON" issues)
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: safeMime, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0,
        maxOutputTokens: 512,
      },
    });

    const rawText = String(response?.text || "").trim();

    let parsed;
    try {
      parsed = extractJson(rawText);
    } catch (e) {
      // Return raw so you can see exactly what Gemini output
      return res.status(500).json({
        error: "Detect failed",
        details: "Invalid JSON",
        raw: rawText.slice(0, 600),
      });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({
      error: "Detect failed",
      details: String(e?.message || e),
    });
  }
}
