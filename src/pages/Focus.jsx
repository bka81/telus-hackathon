import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import focusBg from "../assets/images/focus-mode.jpg";

export default function Focus() {
  const navigate = useNavigate();
  const location = useLocation();

  const tasksFromState = useMemo(() => {
    const t = location.state?.tasks;
    return Array.isArray(t) ? t : [];
  }, [location.state]);

  const titleFromState = useMemo(() => {
    const t = location.state?.title;
    return typeof t === "string" ? t : "";
  }, [location.state]);

  const fallbackTasks = useMemo(
    () => [
      { text: "Find your insurance card", detail: "Check your wallet or your email for a digital copy." },
      { text: "Write down symptoms", detail: "Note when they started and any triggers you noticed." },
      { text: "Set an alarm", detail: "Give yourself a 10–15 minute reset before the next step." },
    ],
    []
  );

  const [dynamicTasks, setDynamicTasks] = useState(() =>
    tasksFromState.length > 0 ? tasksFromState : fallbackTasks
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  // ✅ KEY FIX: when you navigate to /focus with new state, update tasks + reset progress
  useEffect(() => {
    const next = tasksFromState.length > 0 ? tasksFromState : fallbackTasks;
    setDynamicTasks(next);
    setCurrentIndex(0);
    setShowDetail(false);
  }, [tasksFromState, fallbackTasks, location.key]);

  const currentTask = dynamicTasks[currentIndex];

  useEffect(() => {
    setIsWiggling(true);
    const timer = setTimeout(() => setIsWiggling(false), 600);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setShowDetail(false);
    if (currentIndex < dynamicTasks.length - 1) {
      setCurrentIndex((v) => v + 1);
    } else {
      navigate("/reflect");
    }
  };

  const handleComeBackLater = () => {
    setShowDetail(false);

    const taskToMove = dynamicTasks[currentIndex];
    setDynamicTasks((prev) => [...prev, taskToMove]);
    setCurrentIndex((v) => Math.min(v + 1, dynamicTasks.length)); // safe bound
  };

  const progress = dynamicTasks.length > 0 ? ((currentIndex + 1) / dynamicTasks.length) * 100 : 0;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center font-sans overflow-hidden">
      <div
        className="fixed inset-0 -z-10 w-full h-full"
        style={{
          backgroundImage: `url(${focusBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="w-full flex flex-col items-center justify-start pt-20 px-6 z-10 min-h-screen">
        <div className="w-full max-w-md bg-white/40 h-2.5 rounded-full mb-8 shadow-sm">
          <div
            className="bg-[#5072A7] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Optional: show category/scoped title if available */}
        {titleFromState ? (
          <div className="w-full max-w-md text-center mb-6">
            <div className="text-slate-700 font-semibold">{titleFromState}</div>
          </div>
        ) : null}

        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-xl text-center space-y-8 animate-in zoom-in duration-300">
          <p className="text-[#8EACCD] font-bold tracking-widest uppercase text-sm">
            Step {Math.min(currentIndex + 1, dynamicTasks.length)} of {dynamicTasks.length}
          </p>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-slate-800 leading-tight">
              {currentTask?.text ?? String(currentTask ?? "")}
            </h2>

            <button
              onClick={() => setShowDetail((v) => !v)}
              className="flex items-center justify-center gap-2 mx-auto text-[#8EACCD] hover:text-[#5072A7] transition-all group"
              type="button"
            >
              <span
                className={`text-2xl transition-all duration-300 inline-block
                group-hover:rotate-12 group-hover:scale-110
                ${isWiggling ? "animate-bounce translate-x-2 text-3xl" : ""}
              `}
              >
                🪄
              </span>
              <span className="text-sm font-bold uppercase tracking-wider">
                {showDetail ? "Hide hint" : "Tap for hint"}
              </span>
            </button>

            {showDetail && (
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl text-slate-600 text-left text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 border border-slate-100 italic">
                {currentTask?.detail || "You’ve got this. One step at a time."}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="w-full py-5 bg-[#DEE5D4] text-slate-700 rounded-full font-bold text-xl shadow-lg hover:bg-[#ced9c1] transition-transform active:scale-95"
              type="button"
            >
              {currentIndex === dynamicTasks.length - 1 ? "Finish & Reflect" : "Done →"}
            </button>

            <button
              onClick={handleComeBackLater}
              className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
              type="button"
            >
              ↻ Come back to this later
            </button>
          </div>
        </div>

        <p className="mt-8 text-slate-600 font-medium italic drop-shadow-sm">Just focus on this one thing.</p>
      </div>
    </div>
  );
}
