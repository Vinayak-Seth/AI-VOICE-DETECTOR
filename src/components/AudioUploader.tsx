import React, { useState, useRef, useCallback } from 'react';
import { Upload, Mic, StopCircle, Music, X, Play, Pause } from 'lucide-react';
import { AudioData } from '../types';

interface AudioUploaderProps {
  onAudioReady: (data: AudioData | null) => void;
  isProcessing: boolean;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onAudioReady, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const convertToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      alert('Please upload a valid audio file.');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);

    // Convert to base64 for API
    const base64 = await convertToBase64(selectedFile);
    onAudioReady({
      base64,
      mimeType: selectedFile.type,
      blob: selectedFile
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // WebM is standard for recording in Chrome/FF
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setFile(new File([blob], "recording.webm", { type: 'audio/webm' }));
        
        const base64 = await convertToBase64(blob);
        onAudioReady({
          base64,
          mimeType: 'audio/webm',
          blob: blob
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const clearAudio = () => {
    setFile(null);
    setAudioUrl(null);
    onAudioReady(null);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full space-y-4">
      {!audioUrl && !isRecording ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Drop Zone */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
              ${isDragging 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 bg-slate-800/20'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input 
              type="file" 
              accept="audio/*" 
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              className="hidden" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <div className="p-4 bg-slate-800 rounded-full mb-4">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-1">Upload Audio File</h3>
              <p className="text-sm text-slate-500">MP3, WAV, M4A (Max 10MB)</p>
            </label>
          </div>

          {/* Record Button */}
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="border-2 border-slate-700 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-rose-500/50 hover:bg-slate-800/50 bg-slate-800/20 transition-all duration-200"
          >
            <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:bg-slate-700">
              <Mic className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">Record Voice</h3>
            <p className="text-sm text-slate-500">Use your microphone</p>
          </button>
        </div>
      ) : (
        /* Active State (Recording or File Loaded) */
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center animate-fade-in">
          {isRecording ? (
             <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                   <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25"></div>
                   <div className="p-6 bg-slate-900 rounded-full border border-rose-500/50 relative z-10">
                      <Mic className="w-8 h-8 text-rose-500" />
                   </div>
                </div>
                <div className="text-2xl font-mono text-slate-200">{formatTime(recordingTime)}</div>
                <p className="text-rose-400 animate-pulse text-sm font-medium">Recording in progress...</p>
                <button 
                  onClick={stopRecording}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
                >
                  <StopCircle className="w-4 h-4" /> Stop Recording
                </button>
             </div>
          ) : (
             <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                            <Music className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-slate-200 truncate max-w-[200px] md:max-w-md">
                                {file?.name || "Recorded Audio"}
                            </p>
                            <p className="text-xs text-slate-500">
                                {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={clearAudio}
                        disabled={isProcessing}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Custom Audio Player Controls */}
                <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-4 border border-slate-800">
                   <audio 
                        ref={audioRef} 
                        src={audioUrl || ""} 
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        className="hidden" 
                   />
                   <button 
                     onClick={togglePlayback}
                     className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                   >
                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                   </button>
                   <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500/50 w-full animate-pulse"></div> 
                   </div>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
