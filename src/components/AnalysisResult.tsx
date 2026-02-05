import React from 'react';
import { AnalysisResult, Classification } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, BrainCircuit, Code } from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResult | null;
}

const AnalysisResultDisplay: React.FC<AnalysisResultProps> = ({ result }) => {
  if (!result) return null;

  const isAI = result.classification === Classification.AI_GENERATED;
  const confidencePercent = Math.round(result.confidence * 100);

  // Data for chart
  const data = [
    { name: 'Confidence', value: confidencePercent },
    { name: 'Uncertainty', value: 100 - confidencePercent },
  ];

  const COLORS = isAI ? ['#f43f5e', '#334155'] : ['#10b981', '#334155']; // Rose vs Emerald

  return (
    <div className="w-full animate-fade-in-up space-y-6">
      
      {/* Main Verdict Card */}
      <div className={`
        relative overflow-hidden rounded-2xl p-6 border-2 
        ${isAI ? 'border-rose-500 bg-rose-950/20' : 'border-emerald-500 bg-emerald-950/20'}
      `}>
         {/* Background glow effect */}
         <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${isAI ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAI ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                Result
              </span>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Analysis Complete</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              {isAI ? (
                <>
                  <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-rose-500" />
                  AI Generated
                </>
              ) : (
                <>
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                  Human Voice
                </>
              )}
            </h2>
            
            <p className="text-slate-300 max-w-lg leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Confidence Chart */}
          <div className="w-40 h-40 relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${isAI ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {confidencePercent}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase">Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Output View */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono text-slate-400">JSON Response</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
            </div>
        </div>
        <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-xs md:text-sm text-emerald-400/90 leading-relaxed">
{JSON.stringify(result, null, 2)}
            </pre>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultDisplay;
