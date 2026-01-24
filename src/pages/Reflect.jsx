import React, { useState } from 'react';

export default function Reflect() {
  const [feedback, setFeedback] = useState(null);

  // Color Palette mapping
  const colors = {
    primary: '#8EACCD', // Muted Slate
    secondary: '#DEE5D4', // Sage Green (Success)
    accent: '#FEF9D9', // Pale Yellow (Highlight)
    bg: '#D2E0FB', // Soft Blue
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-between" style={{ backgroundColor: colors.bg }}>
      
      {/* Top Section: Validation */}
      <div className="w-full max-w-md text-center mt-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">Great! What's next?</h1>
        <p className="text-slate-600">You completed your task. Take a breath.</p>
      </div>

      {/* Main Card: Feedback & Continuity */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 shadow-sm border border-white/50">
        <div className="space-y-6">
          <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm mb-1 uppercase tracking-wider font-bold">Small Next Step:</p>
            <h2 className="text-xl font-medium text-slate-800">Write down 3 questions for the doctor</h2>
            <p className="text-sm text-slate-500 mt-2 italic">Having them ready reduces stress later.</p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-center text-slate-600 font-medium mb-4">Was this breakdown helpful?</p>
            <div className="flex gap-2">
              {['Too much', 'Just right', 'Too little'].map((choice) => (
                <button
                  key={choice}
                  onClick={() => setFeedback(choice)}
                  className={`flex-1 py-3 px-1 rounded-xl text-xs font-medium transition-all ${
                    feedback === choice 
                    ? 'bg-slate-500 text-white shadow-inner scale-95' 
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-4 mb-10">
        <button 
          className="w-full py-5 rounded-3xl text-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-200/50"
          style={{ backgroundColor: colors.secondary, color: '#4A5568' }}
        >
          Next step
        </button>
        
        <button className="w-full text-slate-500 font-medium opacity-60 hover:opacity-100 transition-opacity">
          I'm done for now
        </button>
      </div>

      {/* Decorative Plant Placeholder (Matches your reference image) */}
      <div className="fixed bottom-0 right-0 -z-10 opacity-40">
        <img 
          src="/plant-icon.png" 
          alt="calm plant" 
          className="w-32 h-auto"
        />
      </div>
    </div>
  );
}