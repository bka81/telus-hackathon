import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Focus({ tasks = [] }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback for demo if tasks aren't passed yet
  const displayTasks = tasks.length > 0 ? tasks : [
    "Find your insurance card",
    "Write down symptoms",
    "Set an alarm"
  ];

  const handleNext = () => {
    if (currentIndex < displayTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/reflect');
    }
  };

  const progress = ((currentIndex + 1) / displayTasks.length) * 100;

  return (
    <div className="min-h-screen bg-[#D2E0FB] flex flex-col items-center justify-center px-6 font-sans">
      {/* Progress Bar */}
      <div className="w-full max-w-md bg-white/30 h-2 rounded-full mb-12">
        <div 
          className="bg-[#8EACCD] h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Single Focus Card */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-xl text-center space-y-8 animate-in zoom-in duration-300">
        <p className="text-[#8EACCD] font-bold tracking-widest uppercase text-sm">
          Step {currentIndex + 1} of {displayTasks.length}
        </p>
        
        <h2 className="text-3xl font-semibold text-slate-800 leading-tight">
          {displayTasks[currentIndex]}
        </h2>

        <button
          onClick={handleNext}
          className="w-full py-5 bg-[#DEE5D4] text-slate-700 rounded-full font-bold text-xl shadow-lg hover:bg-[#ced9c1] transition-transform active:scale-95"
        >
          {currentIndex === displayTasks.length - 1 ? "Finish & Reflect" : "Done →"}
        </button>
      </div>

      {/* Soft Encouragement */}
      <p className="mt-8 text-slate-500 italic">Just focus on this one thing.</p>
    </div>
  );
}