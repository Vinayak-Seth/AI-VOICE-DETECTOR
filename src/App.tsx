import AudioUpload from "./components/AudioUpload";

export default function App() {
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h1 style={{ textAlign: "center", fontSize: 44, marginBottom: 8 }}>Deepfake Detection System</h1>
      <p style={{ textAlign: "center", opacity: 0.85, marginBottom: 28 }}>
        Upload/record audio and classify it as <b>HUMAN</b> or <b>AI_GENERATED</b>.
      </p>

      <AudioUpload />
    </div>
  );
}
