import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUBMISSION_API_KEY = process.env.SUBMISSION_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const analyzeAudioService = async (base64Data, mimeType = "audio/mp3", language = "English") => {
  const prompt = `
You are a specialized Audio Forensics AI participating in a Deepfake Detection Challenge.

TARGET: Classify the input audio as either 'AI_GENERATED' or 'HUMAN'.
LANGUAGE: ${language}

EVALUATION CRITERIA:
1. Breath & Pauses: Real humans breathe. AI often forgets to breathe or places breaths unnaturally.
2. Prosody & Intonation: Human speech has irregular pitch curves. AI often produces flat or cyclic pitch patterns.
3. Spectral Artifacts: Metallic ringing, phasing, high-frequency buzz typical of vocoders.
4. Micro-details: Lip smacks, tongue clicks, throat clearing indicate HUMAN speech.
5. Background: Absolute digital silence between words can indicate AI_GENERATED.

OUTPUT: Return ONLY JSON with:
classification: "AI_GENERATED" or "HUMAN"
confidence: number between 0.0 and 1.0
explanation: short technical explanation
  `.trim();

  const thinkingBudget = 2048;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget },
      maxOutputTokens: thinkingBudget + 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING, enum: ["AI_GENERATED", "HUMAN"] },
          confidence: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["classification", "confidence", "explanation"]
      }
    }
  });

  return JSON.parse(response.text);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  // Auth
  const key = req.headers["x-api-key"];
  if (!SUBMISSION_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured", message: "SUBMISSION_API_KEY not set." });
  }
  if (!key || key !== SUBMISSION_API_KEY) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or missing 'x-api-key' header." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured", message: "GEMINI_API_KEY not set." });
  }

  try {
    const { audio, mimeType, language } = req.body || {};
    if (!audio) return res.status(400).json({ error: "Missing 'audio' field in request body (Base64 required)." });

    const result = await analyzeAudioService(audio, mimeType || "audio/mp3", language || "English");
    return res.status(200).json(result);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return res.status(429).json({ error: "Service busy. Please try again in a few seconds." });
    }
    return res.status(500).json({ error: "Internal Server Error", details: msg });
  }
}
