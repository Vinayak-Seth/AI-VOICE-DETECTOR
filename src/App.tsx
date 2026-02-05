import React, { useState } from 'react';
import Header from './components/Header';
import AudioUploader from './components/AudioUploader';
import AnalysisResultDisplay from './components/AnalysisResult';
import { AnalysisResult, AudioData, SupportedLanguage } from './types';
import { analyzeAudio } from './services/geminiService';
import { Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // Optional: for UI testing you can set VITE_SUBMISSION_API_KEY in .env.local
  const submissionKey = (import.meta as any).env?.VITE_SUBMISSION_API_KEY as string | undefined;

  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>(SupportedLanguage.ENGLISH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudioReady = (data: AudioData | null) => {
    setAudioData(data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!audioData) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Call the service which handles retries and fallbacks internally
      const resultData = await analyzeAudio(audioData.base64, audioData.mimeType, language, submissionKey);
      setResult(resultData);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      
      const msg = err?.message || "";
      if (msg.includes('429') || msg.includes('quota')) {
        setError("System is experiencing high traffic. Please wait 10 seconds and try again.");
      } else if (msg.includes('safety') || msg.includes('blocked')) {
        setError("The audio content was flagged by safety filters. Please try a different sample.");
      } else {
        setError("Could not analyze audio. Please ensure the file is a valid audio format.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">
        
        {/* Intro Section */}
        <section className="text-center space-y-4 animate-fade-in-down">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
             Deepfake Detection System
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
             Advanced forensic analysis to distinguish between <span className="text-white font-semibold">Human</span> speech and <span className="text-emerald-400 font-semibold">AI-Generated</span> audio.
          </p>
        </section>

        {/* Input Card */}
        <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
           <div className="space-y-8">
              
              {/* Language Selector */}
              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300 ml-1">Target Language</label>
                 <div className="relative">
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      disabled={isProcessing}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 pr-10 appearance-none disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {Object.values(SupportedLanguage).map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                 </div>
              </div>

              {/* Audio Uploader */}
              <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Audio Sample</label>
                  <AudioUploader onAudioReady={handleAudioReady} isProcessing={isProcessing} />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!audioData || isProcessing}
                  className={`
                    w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
                    ${!audioData || isProcessing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-emerald-500/20 transform hover:-translate-y-0.5'}
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      running forensic analysis...
                    </>
                  ) : (
                    "Analyze Audio"
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3 text-rose-400 animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
           </div>
        </section>

        {/* Results Section */}
        {result && (
           <section id="results" className="scroll-mt-20">
              <AnalysisResultDisplay result={result} />
           </section>
        )}

      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm">
           <p>© {new Date().getFullYear()} VoiceGuard AI. Powered by Google Gemini 3.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;