import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

const INTAKE_KEY = "lastIntake_v1";
const THEMES_KEY = "lastThemes_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Helps if a function returns JSON wrapped in ```json ... ```
function extractJson(text) {
  if (typeof text !== "string") return null;

  const trimmed = text.trim();

  // If it's already JSON, parse directly
  const direct = safeParse(trimmed);
  if (direct) return direct;

  // Try to strip fenced code blocks
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    return safeParse(fenceMatch[1].trim());
  }

  return null;
}

export default function Breakdown() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Normalize intake: support {task,...} or accidental {focus,...}
  const intake = useMemo(() => {
    const raw =
      location.state && typeof location.state === "object"
        ? location.state
        : safeParse(localStorage.getItem(INTAKE_KEY));

    if (!raw || typeof raw !== "object") return null;

    const task = String(raw.task ?? raw.focus ?? "").trim();

    // Expect strings low/medium/high; fallback safely
    const energy =
      typeof raw.energy === "string"
        ? raw.energy
        : typeof raw.energyLabel === "string"
        ? raw.energyLabel
        : "medium";

    const sensory =
      typeof raw.sensory === "string"
        ? raw.sensory
        : typeof raw.sensoryLabel === "string"
        ? raw.sensoryLabel
        : "medium";

    return {
      task,
      energy: String(energy).toLowerCase(),
      sensory: String(sensory).toLowerCase(),
    };
  }, [location.state]);

  // ✅ Persist normalized intake for refresh safety
  useEffect(() => {
    if (intake?.task) {
      localStorage.setItem(INTAKE_KEY, JSON.stringify(intake));
      console.log("[Breakdown] saved intake:", intake);
    } else {
      console.log("[Breakdown] intake missing task. location.state:", location.state);
      console.log("[Breakdown] INTAKE_KEY localStorage:", localStorage.getItem(INTAKE_KEY));
    }
  }, [intake, location.state]);

  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  const [themes, setThemes] = useState(() => {
    const cached = localStorage.getItem(THEMES_KEY);
    return cached ? safeParse(cached) : null;
  });

  const headline = themes?.headline ?? "Here are the main areas I heard.";
  const subhead = themes?.subhead ?? "Pick one to start. We’ll take it step by step.";
  const categories = Array.isArray(themes?.categories) ? themes.categories : [];

  // ✅ STRICTMODE FIX: prevent duplicate fetches in dev
  const fetchedThemesKeyRef = useRef("");

  // ✅ Fetch 4 categories
  useEffect(() => {
    if (!intake?.task) {
      setLoading(false);
      setError("Missing your input. Please go back and try again.");
      return;
    }

    const requestKey = `${intake.task}__${intake.energy}__${intake.sensory}`;
    if (fetchedThemesKeyRef.current === requestKey) {
      console.log("[Breakdown] skipping duplicate themes fetch (StrictMode):", requestKey);
      return;
    }
    fetchedThemesKeyRef.current = requestKey;

    const run = async () => {
      setLoading(true);
      setError("");

      console.log("[Breakdown] requesting themes for:", intake);

      try {
        const resp = await fetch("/.netlify/functions/themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: intake.task,
            energy: intake.energy || "medium",
            sensory: intake.sensory || "medium",
          }),
        });

        const text = await resp.text();
        console.log("[Breakdown] themes raw response:", text);

        if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);

        const json = extractJson(text);
        console.log("[Breakdown] themes parsed:", json);

        if (!json?.categories || !Array.isArray(json.categories) || json.categories.length !== 4) {
          throw new Error("Themes response invalid (expected exactly 4 categories).");
        }

        setThemes(json);
        localStorage.setItem(THEMES_KEY, JSON.stringify(json));
      } catch (e) {
        console.error("[Breakdown] themes error:", e);
        setError("Couldn’t generate categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [intake?.task, intake?.energy, intake?.sensory]);

  const handlePick = async (category) => {
    if (!intake?.task) return;

    console.log("[Breakdown] picked category:", category);

    setPicking(true);
    setError("");

    try {
      // Scope the prompt to the chosen category
      const scopedTask = `${intake.task}\n\nFocus category: ${category.title} — ${category.subtitle}`;
      console.log("[Breakdown] requesting steps with scoped task:", scopedTask);

      const resp = await fetch("/.netlify/functions/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: scopedTask,
          energy: intake.energy || "medium",
          sensory: intake.sensory || "medium",
        }),
      });

      const text = await resp.text();
      console.log("[Breakdown] steps raw response:", text);

      if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);

      const json = extractJson(text);
      console.log("[Breakdown] steps parsed:", json);

      const steps = Array.isArray(json?.steps) ? json.steps : [];
      const tasks = steps.map((s, idx) => ({
        text: String(s?.title ?? `Step ${idx + 1}`),
        detail: String(s?.detail ?? ""),
      }));

      console.log("[Breakdown] navigating to /focus with tasks:", tasks);

      navigate("/focus", {
        state: {
          intake,
          selectedCategory: category,
          title: json?.title ?? category.title,
          tasks,
          restSuggestion: json?.restSuggestion ?? null,
        },
      });
    } catch (e) {
      console.error("[Breakdown] steps error:", e);
      setError("Couldn’t create steps for that category. Please try another card.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-[100dvh] flex flex-col">
        <nav className="px-6 py-6">
          <Link
            to="/"
            aria-label="Go back"
            className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow"
          >
            ←
          </Link>
        </nav>

        <main className="flex flex-col flex-1 px-4">
          <header className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">{headline}</h1>
            <p className="text-sm text-slate-700/70 mt-2">{subhead}</p>
          </header>

          <div className="flex-grow">
            <div className="bg-white/70 backdrop-blur rounded-[2rem] px-5 py-5">
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-white/80 shadow-sm animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="text-slate-700">
                  <p className="mb-4">{error}</p>
                  <Link
                    to="/"
                    className="inline-block bg-slate-900 text-white px-4 py-2 rounded-xl"
                  >
                    Back
                  </Link>
                </div>
              ) : (
                <>
                  {picking && (
                    <div className="mb-4 text-sm text-slate-700/80">
                      Creating steps…
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((c, idx) => (
                      <button
                        key={c.id ?? `${c.title}-${idx}`}
                        type="button"
                        disabled={picking}
                        onClick={() => handlePick(c)}
                        className="rounded-2xl bg-white/85 shadow-sm p-4 text-left hover:bg-white transition disabled:opacity-70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug">
                              {c.title}
                            </div>
                            <div className="text-xs text-slate-700/70 mt-1">
                              {c.subtitle}
                            </div>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700 text-sm">
                            →
                          </div>
                        </div>

                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-700">
                          {c.stepsCount} steps
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-6 pb-10">
            <div className="text-center text-xs text-slate-700/60">
              Choose one card to begin.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
