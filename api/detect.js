import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUBMISSION_API_KEY = process.env.SUBMISSION_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function stripDataUrl(s) {
  const str = String(s || "");
  const idx = str.indexOf("base64,");
  return idx !== -1 ? str.slice(idx + 7) : str;
}

export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  // Auth (x-api-key must be your submission key)
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
        message: "Send JSON body: { audio: <base64>, language: <string>, mimeType: <string optional> }",
      });
    }

    const base64Data = stripDataUrl(audio);
    const safeMime = mimeType || "audio/*";
    const lang = language || "English";

    const prompt = `
You are a specialized Audio Forensics AI in a Deepfake Detection Challenge.

TASK: Classify the input audio as either "AI_GENERATED" or "HUMAN".
LANGUAGE: ${lang}

Return ONLY JSON with:
- classification: "AI_GENERATED" or "HUMAN"
- confidence: number between 0.0 and 1.0
- explanation: short technical explanation
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: safeMime, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING, enum: ["AI_GENERATED", "HUMAN"] },
            confidence: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
          },
          required: ["classification", "confidence", "explanation"],
        },
      },
    });

    const out = JSON.parse(response.text);
    return res.status(200).json(out);
  } catch (e) {
    const msg = String(e?.message || e);
    return res.status(500).json({
      error: "Detect failed",
      details: msg,
    });
  }
}
