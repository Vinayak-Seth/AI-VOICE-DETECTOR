export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }
  return res.status(200).json({ ok: true, message: "Detect route working" });
}
