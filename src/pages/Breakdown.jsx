import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

// 19 icons
import icon01Checklist from "../assets/images/01_clipboard_checklist.png";
import icon02Bulb from "../assets/images/02_lightbulb_idea_dark.png";
import icon03Home from "../assets/images/03_home.png";
import icon04Bed from "../assets/images/04_sleep_bed.png";
import icon05Heart from "../assets/images/05_health_heart.png";
import icon06Plant from "../assets/images/06_plant_growth.png";
import icon07Mail from "../assets/images/07_mail_envelope.png";
import icon08Calendar from "../assets/images/08_calendar_check.png";
import icon09Dumbbell from "../assets/images/09_dumbbell_fitness.png";
import icon10Food from "../assets/images/10_food_plate.png";
import icon11Bags from "../assets/images/11_shopping_bags.png";
import icon12Briefcase from "../assets/images/12_briefcase.png";
import icon13Target from "../assets/images/13_target.png";
import icon14Decisions from "../assets/images/14_decisions.png";
import icon15Money from "../assets/images/15_money.png";
import icon16Computers from "../assets/images/16_computers.png";
import icon17Connection from "../assets/images/17_connection.png";
import icon18Study from "../assets/images/18_study.png";
import icon19Misc from "../assets/images/19_misc.png";

const INTAKE_KEY = "lastIntake_v1";
const THEMES_KEY = "lastThemes_v1";
const THEMES_SIG_KEY = "lastThemesSig_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Stable id -> icon (best match for your 4 AI categories)
const ICON_BY_ID = {
  focus_now: icon13Target,
  decisions: icon14Decisions,
  money_finance: icon15Money,
  digital_admin: icon16Computers,
};

// Keyword rules for “title-based” icon matching (fallbacks / future expansion)
const KEYWORD_RULES = [
  { keys: ["plan", "planning", "outline", "steps", "checklist"], icon: icon01Checklist },
  { keys: ["idea", "brainstorm", "think", "concept"], icon: icon02Bulb },
  { keys: ["home", "house", "clean", "laundry"], icon: icon03Home },
  { keys: ["sleep", "rest", "break", "tired"], icon: icon04Bed },
  { keys: ["health", "doctor", "medical", "med", "pain"], icon: icon05Heart },
  { keys: ["growth", "self care", "selfcare", "habit"], icon: icon06Plant },
  { keys: ["email", "message", "text", "call", "reply", "communicate"], icon: icon07Mail },
  { keys: ["schedule", "calendar", "appointment", "deadline"], icon: icon08Calendar },
  { keys: ["workout", "gym", "exercise", "fitness", "walk", "run"], icon: icon09Dumbbell },
  { keys: ["food", "cook", "meal", "eat", "grocery"], icon: icon10Food },
  { keys: ["shop", "buy", "order", "errand", "pickup"], icon: icon11Bags },
  { keys: ["job", "career", "travel", "office", "work"], icon: icon12Briefcase },
  { keys: ["focus", "urgent", "now", "today", "asap"], icon: icon13Target },
  { keys: ["decide", "decision", "choose", "option"], icon: icon14Decisions },
  { keys: ["money", "budget", "pay", "bill", "finance", "cost"], icon: icon15Money },
  { keys: ["computer", "digital", "admin", "form", "login", "account", "settings"], icon: icon16Computers },
  { keys: ["friends", "family", "relationship", "social", "connect"], icon: icon17Connection },
  { keys: ["study", "learn", "homework", "quiz", "exam"], icon: icon18Study },
  { keys: ["misc", "other", "random", "anything"], icon: icon19Misc },
];

function pickIcon(category, index = 0) {
  const id = String(category?.id || "").toLowerCase();
  if (ICON_BY_ID[id]) return ICON_BY_ID[id];

  const haystack = `${category?.title || ""} ${category?.subtitle || ""} ${id}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((k) => haystack.includes(k))) return rule.icon;
  }

  // deterministic fallback
  const fallback = [icon13Target, icon14Decisions, icon15Money, icon16Computers];
  return fallback[index] || icon19Misc;
}

export default function Breakdown() {
  const location = useLocation();
  const navigate = useNavigate();

  const intake = useMemo(() => {
    if (location.state && typeof location.state === "object") return location.state;
    const saved = localStorage.getItem(INTAKE_KEY);
    return saved ? safeParse(saved) : null;
  }, [location.state]);

  useEffect(() => {
    if (intake) localStorage.setItem(INTAKE_KEY, JSON.stringify(intake));
  }, [intake]);

  const task = intake?.task ?? "";
  const energy = intake?.energy ?? "medium";
  const sensory = intake?.sensory ?? "medium";

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

  useEffect(() => {
    if (!task) {
      setLoading(false);
      setError("Missing your input. Please go back and try again.");
      return;
    }

    const sig = JSON.stringify({ task, energy, sensory });
    const cachedSig = localStorage.getItem(THEMES_SIG_KEY);
    const cachedThemes = localStorage.getItem(THEMES_KEY);

    // IMPORTANT: prevents double-generation in React 18 dev StrictMode remounts
    if (cachedSig === sig && cachedThemes) {
      const parsed = safeParse(cachedThemes);
      if (parsed?.categories?.length === 4) {
        setThemes(parsed);
        setLoading(false);
        setError("");
        return;
      }
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const resp = await fetch("/.netlify/functions/themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task, energy, sensory }),
        });

        const text = await resp.text();
        if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);

        const json = safeParse(text);
        if (!json?.categories || !Array.isArray(json.categories) || json.categories.length !== 4) {
          throw new Error("Themes response invalid (expected exactly 4 categories).");
        }

        if (cancelled) return;

        setThemes(json);
        localStorage.setItem(THEMES_KEY, JSON.stringify(json));
        localStorage.setItem(THEMES_SIG_KEY, sig);
      } catch (e) {
        console.error("[Breakdown] themes error:", e);
        if (!cancelled) setError("Couldn’t generate categories. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [task, energy, sensory]);

  const handlePick = async (category) => {
    if (!task) return;

    setPicking(true);
    setError("");

    try {
      const resp = await fetch("/.netlify/functions/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          energy,
          sensory,
          category: {
            id: category?.id,
            title: category?.title,
            subtitle: category?.subtitle,
          },
        }),
      });

      const text = await resp.text();
      if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);

      const json = safeParse(text);
      const steps = Array.isArray(json?.steps) ? json.steps : [];

      const tasksForFocus = steps.map((s, idx) => ({
        text: String(s?.title ?? `Step ${idx + 1}`),
        detail: String(s?.detail ?? ""),
      }));

      navigate("/focus", {
        state: {
          tasks: tasksForFocus,
          title: json?.title ?? category.title,
          restSuggestion: json?.restSuggestion ?? null,
          selectedCategory: category,
          intake: { task, energy, sensory },
        },
      });
    } catch (e) {
      console.error("[Breakdown] breakdown error:", e);
      setError("Couldn’t create steps for that category. Please try another card.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <main className="bd" aria-label="Breakdown page">
      <div className="bd__bg" aria-hidden="true" style={{ backgroundImage: `url(${bgImage})` }} />

      <div className="bd__viewport">
        <div className="bd__content">
          <nav className="bd__nav">
            <Link to="/" aria-label="Go back" className="bd__back">
              ←
            </Link>
          </nav>

          <header className="bd__header">
            <h1 className="bd__title">{headline}</h1>
            <p className="bd__sub">{subhead}</p>
          </header>

          <section className="bd__panel" aria-label="Categories">
            {loading ? (
              <div className="bd__grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="bd__skeleton" />
                ))}
              </div>
            ) : error ? (
              <div className="bd__error">
                <p className="bd__errorText">{error}</p>
                <Link to="/" className="bd__errorBtn">
                  Back
                </Link>
              </div>
            ) : (
              <>
                {picking && <div className="bd__status">Creating steps…</div>}

                <div className="bd__grid">
                  {categories.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={picking}
                      onClick={() => handlePick(c)}
                      className="bd__card"
                    >
                      <div className="bd__icon" aria-hidden="true">
                        <img src={pickIcon(c, idx)} alt="" className="bd__iconImg" loading="lazy" />
                      </div>

                      <div className="bd__cardTitle">{c.title}</div>

                      <div className="bd__pill">{c.stepsCount} steps</div>

                      <div className="bd__arrow" aria-hidden="true">
                        →
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <footer className="bd__footer">
            <div className="bd__hint">Choose one card to begin.</div>
          </footer>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .bd{
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100svh;
          overflow: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .bd__bg{
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: scale(1.01);
          z-index: 0;
        }

        .bd__bg::after{
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 55%,
            rgba(255,255,255,0.10),
            rgba(255,255,255,0.30)
          );
        }

        .bd__viewport{
          position: relative;
          z-index: 1;
          height: 100%;
          width: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;

          display: flex;
          justify-content: center;
          align-items: flex-start;

          padding:
            max(10px, env(safe-area-inset-top))
            18px
            max(14px, env(safe-area-inset-bottom))
            18px;
        }

        .bd__content{
          width: 100%;
          max-width: 480px;
          padding-top: 10px;
        }

        .bd__nav{
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .bd__back{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.70);
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: 0 10px 25px rgba(27,34,46,0.10);
          text-decoration: none;
          color: rgba(27,34,46,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .bd__header{
          text-align: center;
          margin: 14px 0 16px;
          padding: 0 8px;
        }

        .bd__title{
          margin: 0;
          font-size: 22px;
          font-weight: 650;
          color: rgba(27,34,46,0.86);
          letter-spacing: 0.1px;
        }

        .bd__sub{
          margin: 8px 0 0;
          font-size: 13px;
          font-weight: 500;
          color: rgba(27,34,46,0.55);
          line-height: 1.35;
        }

        .bd__panel{
          border-radius: 28px;
          background: rgba(255,255,255,0.40);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: 0 22px 70px rgba(27,34,46,0.10);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 16px;
        }

        .bd__status{
          font-size: 12px;
          color: rgba(27,34,46,0.55);
          margin-bottom: 10px;
          text-align: center;
        }

        .bd__grid{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .bd__skeleton{
          height: 132px;
          border-radius: 24px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.70);
          box-shadow: 0 10px 20px rgba(27,34,46,0.06);
          animation: pulse 1.2s ease-in-out infinite;
        }

        @keyframes pulse{
          0%,100%{ opacity: 0.85; }
          50%{ opacity: 0.55; }
        }

        .bd__card{
          position: relative;
          height: 132px;
          border-radius: 24px;
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: 0 14px 28px rgba(27,34,46,0.10);
          padding: 14px;
          text-align: left;
          cursor: pointer;

          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 10px;

          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }

        .bd__card:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 34px rgba(27,34,46,0.12);
          background: rgba(255,255,255,0.72);
        }

        .bd__card:disabled{
          opacity: 0.75;
          cursor: not-allowed;
        }

        .bd__icon{
          position: absolute;
          top: 12px;
          left: 12px;
          width: 36px;
          height: 36px;
          border-radius: 14px;
          background: rgba(142,172,205,0.20);
          border: 1px solid rgba(142,172,205,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .bd__iconImg{
          width: 26px;
          height: 26px;
          object-fit: contain;
        }

        .bd__arrow{
          position: absolute;
          top: 12px;
          right: 12px;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(27,34,46,0.55);
          font-weight: 700;
        }

        .bd__cardTitle{
          font-size: 15px;
          font-weight: 650;
          color: rgba(27,34,46,0.82);
          line-height: 1.15;
          padding-right: 18px;
        }

        .bd__pill{
          align-self: flex-start;
          font-size: 12px;
          font-weight: 600;
          color: rgba(27,34,46,0.62);
          background: rgba(255,255,255,0.70);
          border: 1px solid rgba(255,255,255,0.80);
          padding: 6px 10px;
          border-radius: 999px;
        }

        .bd__error{
          text-align: center;
          padding: 18px 10px;
        }

        .bd__errorText{
          margin: 0 0 12px;
          color: rgba(27,34,46,0.70);
          font-size: 14px;
        }

        .bd__errorBtn{
          display: inline-block;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(27,34,46,0.85);
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
        }

        .bd__footer{
          padding: 14px 0 18px;
          text-align: center;
        }

        .bd__hint{
          font-size: 12px;
          color: rgba(27,34,46,0.55);
        }
      `}</style>
    </main>
  );
}
