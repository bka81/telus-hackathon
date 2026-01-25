// Focus.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import focusBg from "../assets/images/focus-mode.jpg";

const PROGRESS_KEY = "lastProgress_v1";

// debug tool (kept, but NOT used for styling to avoid “pink outline” issues)
const DEV_VISUAL_TAG = true;

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function loadProgress(sig) {
  const all = safeParse(localStorage.getItem(PROGRESS_KEY)) || {};
  return all?.[sig] || null;
}

function saveProgress(sig, next) {
  const all = safeParse(localStorage.getItem(PROGRESS_KEY)) || {};
  all[sig] = next;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

function countDone(tasks) {
  return tasks.reduce((n, t) => n + (t?.done ? 1 : 0), 0);
}

function firstTodoIndex(tasks) {
  const i = tasks.findIndex((t) => !t?.done);
  return i === -1 ? Math.max(0, tasks.length - 1) : i;
}

function normalizeTasks(arr) {
  const base = Array.isArray(arr) ? arr : [];
  return base.map((t, idx) => ({
    id: String(t?.id ?? `s_${idx + 1}`),
    text: String(t?.text ?? ""),
    detail: String(t?.detail ?? ""),
    done: !!t?.done,
  }));
}

export default function Focus() {
  const navigate = useNavigate();
  const location = useLocation();

  const sigFromState = useMemo(() => {
    const s = location.state?.sig;
    return typeof s === "string" ? s : null;
  }, [location.state]);

  const selectedCategory = useMemo(
    () => location.state?.selectedCategory || null,
    [location.state]
  );

  const titleFromState = useMemo(() => {
    const t = location.state?.title;
    return typeof t === "string" ? t : "";
  }, [location.state]);

  const tasksFromState = useMemo(() => {
    const t = location.state?.tasks;
    return Array.isArray(t) ? t : [];
  }, [location.state]);

  const fallbackTasks = useMemo(
    () => [
      {
        id: "s_1",
        text: "Find your insurance card",
        detail: "Check your wallet or your email for a digital copy.",
        done: false,
      },
      {
        id: "s_2",
        text: "Write down symptoms",
        detail: "Note when they started and any triggers you noticed.",
        done: false,
      },
      {
        id: "s_3",
        text: "Set an alarm",
        detail: "Give yourself a 10–15 minute reset before the next step.",
        done: false,
      },
    ],
    []
  );

  const initialTasks = useMemo(() => {
    const catId = String(selectedCategory?.id || "");
    if (sigFromState && catId) {
      const p = loadProgress(sigFromState);
      const saved = p?.perCategory?.[catId]?.tasks;
      if (Array.isArray(saved) && saved.length > 0) return normalizeTasks(saved);
    }

    if (tasksFromState.length > 0) return normalizeTasks(tasksFromState);
    return normalizeTasks(fallbackTasks);
  }, [sigFromState, selectedCategory?.id, tasksFromState, fallbackTasks]);

  const [dynamicTasks, setDynamicTasks] = useState(initialTasks);
  const [currentIndex, setCurrentIndex] = useState(() => firstTodoIndex(initialTasks));
  const [showDetail, setShowDetail] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  const persistCategory = (nextTasks, overrides = {}) => {
    if (!sigFromState || !selectedCategory?.id) return;

    const catId = String(selectedCategory.id);
    const doneSteps = countDone(nextTasks);
    const totalSteps = Number(selectedCategory?.stepsCount) || nextTasks.length;

    const current =
      loadProgress(sigFromState) || { completedSteps: 0, totalSteps: 0, perCategory: {} };
    if (!current.perCategory) current.perCategory = {};

    const prev = current.perCategory[catId] || {};
    const nextStatus =
      overrides.status || (doneSteps >= nextTasks.length ? "completed" : prev.status || "active");

    current.perCategory[catId] = {
      doneSteps,
      totalSteps,
      status: nextStatus,
      tasks: nextTasks,
      title:
        overrides.title ??
        prev.title ??
        titleFromState ??
        String(selectedCategory?.title || ""),
      restSuggestion: overrides.restSuggestion ?? prev.restSuggestion ?? null,
      iconKey: overrides.iconKey ?? prev.iconKey ?? selectedCategory?.iconKey ?? null,
    };

    current.completedSteps = Object.values(current.perCategory).reduce(
      (sum, v) => sum + Number(v?.doneSteps || 0),
      0
    );

    saveProgress(sigFromState, current);
  };

  useEffect(() => {
    const next = initialTasks;
    setDynamicTasks(next);
    setCurrentIndex(firstTodoIndex(next));
    setShowDetail(false);

    persistCategory(next, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const currentTask = dynamicTasks[currentIndex];

  useEffect(() => {
    setIsWiggling(true);
    const timer = setTimeout(() => setIsWiggling(false), 600);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const doneCount = useMemo(() => countDone(dynamicTasks), [dynamicTasks]);
  const totalCount = dynamicTasks.length || 1;
  const progressPct = (doneCount / totalCount) * 100;

  const goBackToBreakdown = () => {
    persistCategory(dynamicTasks, {});
    navigate("/breakdown");
  };

  const handleNext = () => {
    setShowDetail(false);

    const nextTasks = dynamicTasks.map((t, idx) =>
      idx === currentIndex ? { ...t, done: true } : t
    );
    setDynamicTasks(nextTasks);

    persistCategory(nextTasks, {});

    if (countDone(nextTasks) >= nextTasks.length) {
      persistCategory(nextTasks, {
        status: "completed",
        iconKey: selectedCategory?.iconKey ?? null,
      });

      navigate("/reflect", {
        state: {
          sig: sigFromState,
          lastCompletedCatId: String(selectedCategory?.id || ""),
        },
      });

      return;
    }

    setCurrentIndex(firstTodoIndex(nextTasks));
  };

  const handleComeBackLater = () => {
    setShowDetail(false);

    const taskToMove = dynamicTasks[currentIndex];
    const rest = dynamicTasks.filter((_, idx) => idx !== currentIndex);
    const nextTasks = [...rest, taskToMove];

    setDynamicTasks(nextTasks);
    setCurrentIndex(firstTodoIndex(nextTasks));

    persistCategory(nextTasks, {});
  };

  // Mobile-safe button label: short on very small screens, full on >= sm
  const PrimaryLabel = ({ isLast }) => (
    <>
      <span className="block sm:hidden">{isLast ? "Finish →" : "Done →"}</span>
      <span className="hidden sm:block">
        {isLast ? "Finish & Get Summary →" : "Done →"}
      </span>
    </>
  );

  const isLastStep = doneCount === totalCount - 1;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center font-sans overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className="fixed inset-0 -z-10 w-full h-full"
        style={{
          backgroundImage: `url(${focusBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* TOP BAR — compact + no wrapping on small phones */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 z-10 gap-2">
        <button
          onClick={goBackToBreakdown}
          className={[
            "h-9 sm:h-11",
            "px-3 sm:px-4",
            "rounded-xl sm:rounded-2xl",
            "bg-white/70 border border-white/80 shadow-sm",
            "text-slate-700 text-sm sm:text-base font-semibold",
            "whitespace-nowrap",
            // remove any accidental outlines/rings
            "outline-none focus:outline-none focus:ring-0",
          ].join(" ")}
          type="button"
        >
          ← Categories
        </button>

        <div
          className={[
            "text-slate-700 font-semibold",
            "text-sm sm:text-base",
            "bg-white/60 border border-white/80",
            "px-3 py-1.5 sm:px-3 sm:py-2",
            "rounded-xl sm:rounded-2xl shadow-sm",
            "whitespace-nowrap",
          ].join(" ")}
        >
          {doneCount}/{totalCount} done
        </div>
      </div>

      <div className="w-full flex flex-col items-center justify-start pt-6 sm:pt-8 px-4 sm:px-6 z-10 min-h-screen">
        {/* Progress bar wrapper */}
        <div className="w-full max-w-lg bg-white/40 h-2.5 rounded-full mb-6 sm:mb-8 shadow-sm">
          <div
            className="bg-[#5072A7] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {titleFromState ? (
          <div className="w-full max-w-lg text-center mb-5 sm:mb-6 px-1">
            <div className="text-slate-700 font-semibold text-sm sm:text-base">
              {titleFromState}
            </div>
          </div>
        ) : null}

        {/* CARD — fills width nicely on small phones, still capped */}
        <div
          className={[
            "w-full",
            "max-w-[420px] sm:max-w-lg",
            "bg-white",
            "rounded-[2rem] sm:rounded-[2.5rem]",
            "px-7 py-8 sm:px-10 sm:py-10",
            "shadow-xl",
            "text-center",
            "space-y-7 sm:space-y-8",
            "animate-in zoom-in duration-300",
          ].join(" ")}
        >
          <p className="text-[#8EACCD] font-bold tracking-widest uppercase text-xs sm:text-sm">
            Step {Math.min(doneCount + 1, totalCount)} of {totalCount}
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 leading-tight">
              {currentTask?.text ?? ""}
            </h2>

            <button
              onClick={() => setShowDetail((v) => !v)}
              className={[
                "flex items-center justify-center gap-2 mx-auto",
                "text-[#8EACCD] hover:text-[#5072A7] transition-all group",
                "outline-none focus:outline-none focus:ring-0",
              ].join(" ")}
              type="button"
            >
              <span
                className={`text-2xl transition-all duration-300 inline-block
                group-hover:rotate-12 group-hover:scale-110
                ${isWiggling ? "animate-bounce translate-x-2 text-3xl" : ""}`}
              >
                ✦
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
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
            {/* PRIMARY BUTTON — no overflow, no weird outline, scales perfectly */}
            <button
              onClick={handleNext}
              type="button"
              className={[
                "w-full",
                "rounded-full",
                "bg-[#DEE5D4] hover:bg-[#ced9c1]",
                "text-slate-700",
                "shadow-lg",
                "transition-transform active:scale-95",
                "min-h-[56px] sm:min-h-[64px]",
                "px-6 sm:px-8",
                "py-4 sm:py-6",
                "font-extrabold",
                "text-base sm:text-lg",
                "tracking-tight",
                // critical: keep single-line; we provide short label on small screens anyway
                "whitespace-nowrap",
                // remove focus ring/outline that causes “pink border” look
                "outline-none focus:outline-none focus:ring-0 focus-visible:ring-0",
              ].join(" ")}
            >
              <PrimaryLabel isLast={isLastStep} />
            </button>

            <button
              onClick={handleComeBackLater}
              className={[
                "text-slate-400 text-[11px] sm:text-xs",
                "font-bold uppercase tracking-widest",
                "hover:text-slate-600 transition-colors",
                "outline-none focus:outline-none focus:ring-0",
              ].join(" ")}
              type="button"
            >
              ↻ Come back to this later
            </button>
          </div>
        </div>

        <p className="mt-7 sm:mt-8 text-slate-600 font-medium italic drop-shadow-sm text-sm sm:text-base">
          Just focus on this one thing.
        </p>

        {/* Optional dev visual tag (disabled by default styling) */}
        {DEV_VISUAL_TAG ? null : null}
      </div>
    </div>
  );
}
