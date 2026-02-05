import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;
const SUBMISSION_API_KEY = "voiceguard-submission-key-v1";

// Middleware
app.use(cors());
// Increase payload limit to handle Base64 audio files
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini
// Ensure process.env.API_KEY is set in your deployment environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ---------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ---------------------------------------------------------
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== SUBMISSION_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing 'x-api-key' header."
    });
  }
  next();
};

// ---------------------------------------------------------
// HELPER: GEMINI LOGIC
// ---------------------------------------------------------
const analyzeAudioService = async (base64Data, language = "English") => {
  const prompt = `
    You are a specialized Audio Forensics AI participating in a Deepfake Detection Challenge.
    
    TARGET: Classify the input audio as either 'AI_GENERATED' or 'HUMAN'.
    LANGUAGE: ${language}
    
    EVALUATION CRITERIA:
    1. **Breath & Pauses**: Real humans breathe. AI often forgets to breathe or places breaths at unnatural intervals.
    2. **Prosody & Intonation**: Human speech has irregular pitch curves. AI often produces "flat" or "perfectly cyclic" pitch patterns.
    3. **Spectral Artifacts**: Listen for metallic ringing, phasing, or high-frequency buzz typical of neural vocoders.
    4. **Micro-details**: Lip smacks, tongue clicks, and throat clearing are strong indicators of HUMAN speech.
    5. **Background**: Absolute digital silence between words is a strong indicator of AI_GENERATED.
    
    OUTPUT: Return a JSON object with the classification, a confidence score (0.0-1.0), and a brief technical explanation.
  `;

  // Model Config with Thinking Budget for high accuracy
  const model = 'gemini-3-pro-preview';
  const thinkingBudget = 2048;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/mp3', data: base64Data } },
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

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Health Check
app.get('/', (req, res) => {
  res.send('VoiceGuard AI Detection API is Online. Send POST requests to /api/detect');
});

/**
 * POST /api/detect
 * Headers: { "x-api-key": "voiceguard-submission-key-v1" }
 * Body: { "audio": "BASE64_STRING...", "language": "English" }
 */
app.post('/api/detect', authenticate, async (req, res) => {
  try {
    const { audio, language } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing 'audio' field in request body (Base64 string required)." });
    }

    // Run Analysis
    const result = await analyzeAudioService(audio, language || "English");

    // Return strictly formatted JSON
    res.json(result);

  } catch (error) {
    console.error("API Error:", error);
    
    // Handle Quota/Rate Limits gracefully
    if (error.message?.includes('429') || error.message?.includes('quota')) {
       return res.status(429).json({ error: "Service busy. Please try again in a few seconds." });
    }

    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/detect`);
  console.log(`Required Key: ${SUBMISSION_API_KEY}`);
});