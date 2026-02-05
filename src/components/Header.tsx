import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <Cpu className="w-4 h-4 text-emerald-400 absolute -bottom-1 -right-1 bg-slate-900 rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                VoiceGuard AI
              </h1>
              <p className="text-xs text-slate-400 tracking-wider">DEEPFAKE DETECTION SYSTEM</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
               API Status: <span className="text-emerald-400 font-semibold">Online</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
