export type DetectResponse = {
  classification: "AI_GENERATED" | "HUMAN";
  confidence: number;
  explanation: string;
};

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      // result looks like: data:audio/webm;base64,AAAA....
      const base64 = result.includes("base64,") ? result.split("base64,")[1] : "";
      if (!base64) reject(new Error("Failed to convert audio to base64"));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(file);
  });
}

export async function detectDeepfake(file: File, language: string): Promise<DetectResponse> {
  const base64 = await fileToBase64(file);

  const submissionKey = import.meta.env.VITE_SUBMISSION_API_KEY || "";

  const res = await fetch("/api/detect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ✅ Your backend requires this header
      "x-api-key": submissionKey,
    },
    body: JSON.stringify({
      audio: base64,
      mimeType: file.type || "audio/*",
      language,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.details || data?.message || data?.error || `HTTP ${res.status}`);
  }

  return data as DetectResponse;
}
