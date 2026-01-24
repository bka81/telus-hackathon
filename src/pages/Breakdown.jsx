import { Link } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

export default function Breakdown() {
  const tasks = [
    "Find your insurance card",
    "Write down any questions or symptoms",
    "Gather any medical records you may need",
    "Bring a water bottle",
    "Set an alarm 30 minutes before you need to leave",
  ];

  return (
    /* OUTSIDE BEIGE */
    <div className="min-h-screen bg-[#F4F1EC] flex items-center justify-center px-4 font-sans">
      
      {/* PHONE */}
      <div className="relative w-full max-w-[390px] h-[780px] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <Link
      to="/"
      className="
      absolute
      top-6
      left-6
      z-20
      w-10
      h-10
      rounded-full
      bg-white/90
      flex
      items-center
      justify-center
      shadow-md
      text-slate-700
      hover:bg-white
      transition
      active:scale-95
  "
  aria-label="Go back home"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
</Link>

        
        {/* BACKGROUND IMAGE — VISIBLE */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />

        {/* CONTENT LAYER */}
        <div className="relative z-10 flex flex-col h-full px-6">
          
          {/* HEADER */}
          <header className="pt-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-800">
              unlinear
            </h1>
          </header>

          {/* INTRO */}
          <div className="pt-6 pb-4 text-center space-y-2">
            <p className="text-xl font-medium text-slate-900">
              Let’s prepare for your doctor appointment.
            </p>
            <p className="text-slate-600">
              We’ll take it one step at a time.
            </p>
          </div>

          {/* MOOD */}
          <div className="flex justify-center gap-3 pb-6">
            <span className="px-4 py-2 rounded-full bg-slate-200 text-slate-600 text-sm font-medium">
              Overwhelmed
            </span>
            <span className="px-4 py-2 rounded-full bg-green-200 text-green-800 text-sm font-medium">
              Somewhat calm
            </span>
          </div>

          {/* TASK LIST */}
          <div className="flex-1 space-y-4">
            {tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/90 rounded-2xl px-5 py-4 shadow-sm"
              >
                <div className="w-6 h-6 rounded-md border-2 border-green-500 flex items-center justify-center text-green-600 font-bold">
                  ✓
                </div>
                <p className="text-slate-900 font-medium">
                  {task}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pb-8 pt-6">
            <Link
              to="/focus"
              className="block text-center bg-green-500 text-white font-semibold text-lg py-4 rounded-full shadow-lg hover:bg-green-600 transition active:scale-95"
            >
              Start first step
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
