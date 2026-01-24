import { useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

export default function Breakdown() {
  const [tasks, setTasks] = useState([
    { text: "Find your insurance card", done: false },
    { text: "Write down any questions or symptoms", done: false },
    { text: "Gather any medical records you may need", done: false },
    { text: "Bring a water bottle", done: false },
    { text: "Set an alarm 30 minutes before you need to leave", done: false },
  ]);

  const toggleTask = (index) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, done: !task.done } : task
      )
    );
  };

  return (
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >

      {/* CONTENT */}
      <div className="min-h-[100dvh] flex flex-col">

        {/* NAV */}
        <nav className="px-6 py-6">
          <Link
            to="/"
            className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow"
          >
            ←
          </Link>
        </nav>

        {/* MAIN — FULL WIDTH */}
        <main className="flex flex-col flex-1 px-4">

          {/* HEADER */}
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Doctor appointment
            </h1>
            <p className="text-[10px] tracking-widest uppercase text-slate-700 opacity-60 mt-1">
              Action Plan • Today
            </p>
          </header>

         {/* TASK LIST — SINGLE CARD */}
<div className="flex-grow">
  <div
    className="
      bg-white/80 backdrop-blur
      rounded-[2rem]
      px-6 py-5
      space-y-4
    "
  >
    {tasks.map((task, i) => (
      <label
        key={i}
        className="flex items-start gap-4 cursor-pointer"
      >
        {/* CHECKBOX */}
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleTask(i)}
          className="
            mt-1
            h-5 w-5
            rounded-md
            border
            border-slate-400
            text-green-700
            accent-green-700
          "
        />

        {/* TEXT */}
        <span
          className={`text-base text-slate-800 leading-snug ${
            task.done ? "line-through opacity-50" : ""
          }`}
        >
          {task.text}
        </span>
      </label>
    ))}
  </div>
</div>

          {/* CTA */}
          <div className="pt-6 pb-10">
            <Link
              to="/focus"
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
