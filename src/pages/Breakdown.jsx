import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

export default function Breakdown() {
  const location = useLocation();

  // 1) Get the data from navigation state (and fallback to localStorage if refreshed)
  const apiData =
    location.state ||
    (() => {
      const saved = localStorage.getItem("lastBreakdown");
      return saved ? JSON.parse(saved) : null;
    })();

  // 2) Build tasks from API steps (instead of hardcoded list)
  const [tasks, setTasks] = useState(() => {
    const steps = apiData?.steps ?? [];
    return steps.map((s) => ({
      text: s.title, // show step title in the list
      detail: s.detail, // detail to reveal on click
      done: false,
    }));
  });

  // ✅ which task is expanded
  const [openIndex, setOpenIndex] = useState(null);

  const toggleTask = (index) => {
    setTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, done: !task.done } : task))
    );
  };

  const toggleDetail = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const pageTitle = apiData?.title || "Your plan";

  return (
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-[100dvh] flex flex-col">
        <nav className="px-6 py-6">
          <Link
            to="/"
            className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow"
          >
            ←
          </Link>
        </nav>

        <main className="flex flex-col flex-1 px-4">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-[10px] tracking-widest uppercase text-slate-700 opacity-60 mt-1">
              Action Plan • Today
            </p>
          </header>

          <div className="flex-grow">
            <div className="bg-white/80 backdrop-blur rounded-[2rem] px-6 py-5 space-y-4">
              {tasks.length === 0 ? (
                <p className="text-slate-700">No steps yet. Go back and try again.</p>
              ) : (
                tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-4">
                    {/* CHECKBOX */}
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(i)}
                      className="mt-1 h-5 w-5 rounded-md border border-slate-400 text-green-700 accent-green-700"
                    />

                    {/* CLICKABLE TEXT (shows detail) */}
                    <button
                      type="button"
                      onClick={() => toggleDetail(i)}
                      className="flex-1 text-left"
                    >
                      <div
                        className={`text-base text-slate-800 leading-snug ${
                          task.done ? "line-through opacity-50" : ""
                        }`}
                      >
                        {task.text}
                      </div>

                      {/* DETAIL (only when clicked) */}
                      {openIndex === i && task.detail && (
                        <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {task.detail}
                        </div>
                      )}
                    </button>
                  </div>
                ))
              )}

              {/* Optional: show rest suggestion if returned */}
              {apiData?.restSuggestion && (
                <div className="mt-2 rounded-xl bg-white/70 p-4 text-sm text-slate-700">
                  <strong>Rest suggestion:</strong> {apiData.restSuggestion.minutes} min —{" "}
                  {apiData.restSuggestion.reason}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 pb-10">
            <Link
              to="/focus"
              state={{ tasks: tasks }}
              className="block w-full bg-green-900 text-white font-bold py-4 rounded-2xl text-center hover:bg-green-800 transition"
            >
              Start first step
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
