import React, { useMemo, useState } from "react";
import { detectDeepfake, type DetectResponse } from "../services/detectService";

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Malayalam"] as const;

export default function AudioUpload() {
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("English");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [result, setResult] = useState<DetectResponse | null>(null);
  const [error, setError] = useState<string>("");

  const audioUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError("");

    const f = e.target.files?.[0] || null;
    if (!f) return;

    // Accept common audio types; webm/mp3/wav etc.
    if (!f.type.startsWith("audio/")) {
      setError("Please upload a valid audio file (mp3, wav, webm, etc.)");
      return;
    }

    setFile(f);
  };

  const onAnalyze = async () => {
    if (!file) {
      setError("Please upload/record an audio file first.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const out = await detectDeepfake(file, language);
      setResult(out);
    } catch (e: any) {
      setError(e?.message || "Failed to analyze audio");
    } finally {
      setIsLoading(false);
    }
  };

  const badgeText =
    result?.classification === "HUMAN"
      ? "HUMAN"
      : result?.classification === "AI_GENERATED"
      ? "AI GENERATED"
      : "";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Target Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            outline: "none",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l} style={{ color: "black" }}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Audio Sample</label>

        <input
          type="file"
          accept="audio/*"
          onChange={onPickFile}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
          }}
        />

        {file && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{file.name}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "audio"}
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError("");
                }}
                style={{
                  background: "transparent",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  height: 34,
                }}
              >
                ✕
              </button>
            </div>

            {audioUrl && (
              <audio controls style={{ width: "100%", marginTop: 10 }}>
                <source src={audioUrl} type={file.type} />
              </audio>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onAnalyze}
        disabled={isLoading || !file}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 12,
          border: "none",
          cursor: isLoading || !file ? "not-allowed" : "pointer",
          fontWeight: 800,
          fontSize: 16,
          background: "linear-gradient(90deg, #12b981, #0ea5e9)",
          color: "white",
          opacity: isLoading || !file ? 0.7 : 1,
        }}
      >
        {isLoading ? "Analyzing..." : "Analyze Audio"}
      </button>

      {/* Result */}
      {result && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                fontWeight: 800,
                background:
                  result.classification === "HUMAN" ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
                border:
                  result.classification === "HUMAN"
                    ? "1px solid rgba(16,185,129,0.35)"
                    : "1px solid rgba(239,68,68,0.35)",
              }}
            >
              {badgeText}
            </div>

            <div style={{ opacity: 0.9 }}>
              Confidence: <b>{(result.confidence * 100).toFixed(1)}%</b>
            </div>
          </div>

          <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
            <b>Explanation:</b> {result.explanation}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.12)",
            color: "white",
          }}
        >
          <b>Error:</b> {error}
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 12 }}>
            Tip: Make sure Vercel has <code>GEMINI_API_KEY</code>, <code>SUBMISSION_API_KEY</code>, and for UI calls
            <code> VITE_SUBMISSION_API_KEY</code>.
          </div>
        </div>
      )}
    </div>
  );
}
