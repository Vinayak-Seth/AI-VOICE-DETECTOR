import { AnalysisResult } from "../types";

/**
 * Calls the deployed backend (Vercel Serverless Function) instead of calling Gemini directly
 * from the browser (never expose GEMINI_API_KEY in frontend).
 *
 * Endpoint: POST /api/detect
 * Headers:  x-api-key: <SUBMISSION_API_KEY>   (optional for UI; required for evaluator calls)
 */
export const analyzeAudio = async (
  base64Data: string,
  mimeType: string,
  language: string,
  submissionKey?: string
): Promise<AnalysisResult> => {
  const res = await fetch("/api/detect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(submissionKey ? { "x-api-key": submissionKey } : {})
    },
    body: JSON.stringify({
      audio: base64Data,
      mimeType,
      language
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.details)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as AnalysisResult;
};
