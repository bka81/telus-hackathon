import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

// ✅ ADD: loading gif (make sure the path matches where you saved it)
import loadingGif from "../assets/images/loading.gif";

// 19 icons
import iconChecklist from "../assets/images/01_clipboard_checklist.png";
import iconBulb from "../assets/images/02_lightbulb_idea_dark.png";
import iconHome from "../assets/images/03_home.png";
import iconBed from "../assets/images/04_sleep_bed.png";
import iconHeart from "../assets/images/05_health_heart.png";
import iconPlant from "../assets/images/06_plant_growth.png";
import iconMail from "../assets/images/07_mail_envelope.png";
import iconCalendar from "../assets/images/08_calendar_check.png";
import iconDumbbell from "../assets/images/09_dumbbell_fitness.png";
import iconFood from "../assets/images/10_food_plate.png";
import iconBags from "../assets/images/11_shopping_bags.png";
import iconBriefcase from "../assets/images/12_briefcase.png";
import iconTarget from "../assets/images/13_target.png";
import iconDecisions from "../assets/images/14_decisions.png";
import iconMoney from "../assets/images/15_money.png";
import iconComputers from "../assets/images/16_computers.png";
import iconConnection from "../assets/images/17_connection.png";
import iconStudy from "../assets/images/18_study.png";
import iconMisc from "../assets/images/19_misc.png";

const INTAKE_KEY = "lastIntake_v1";
const THEMES_KEY = "lastThemes_v1";
const THEMES_SIG_KEY = "lastThemesSig_v1";

// Progress persistence (includes per-category tasks so Focus can resume)
const PROGRESS_KEY = "lastProgress_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getSig({ task, energy, sensory }) {
  return JSON.stringify({
    task: task || "",
    energy: energy || "medium",
    sensory: sensory || "medium",
  });
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

// 19 icon-key mapping (expects iconKey like: "checklist", "money", "study", etc.)
const ICONS_BY_KEY = {
  checklist: iconChecklist,
  bulb: iconBulb,
  home: iconHome,
  bed: iconBed,
  heart: iconHeart,
  plant: iconPlant,
  mail: iconMail,
  calendar: iconCalendar,
  dumbbell: iconDumbbell,
  food: iconFood,
  bags: iconBags,
  briefcase: iconBriefcase,
  target: iconTarget,
  decisions: iconDecisions,
  money: iconMoney,
  computers: iconComputers,
  connection: iconConnection,
  study: iconStudy,
  misc: iconMisc,
};

// Stable id -> icon (best match for your 4 AI categories)
const ICON_BY_ID = {
  focus_now: iconTarget,
  decisions: iconDecisions,
  money_finance: iconMoney,
  digital_admin: iconComputers,
};

// Keyword rules fallback (in case iconKey is missing)
const KEYWORD_RULES = [
  { keys: ["plan", "planning", "outline", "steps", "checklist"], icon: iconChecklist },
  { keys: ["idea", "brainstorm", "think", "concept"], icon: iconBulb },
  { keys: ["home", "house", "clean", "laundry"], icon: iconHome },
  { keys: ["sleep", "rest", "break", "tired"], icon: iconBed },
  { keys: ["health", "doctor", "medical", "med", "pain"], icon: iconHeart },
  { keys: ["growth", "self care", "selfcare", "habit"], icon: iconPlant },
  { keys: ["email", "message", "text", "call", "reply", "communicate"], icon: iconMail },
  { keys: ["schedule", "calendar", "appointment", "deadline"], icon: iconCalendar },
  { keys: ["workout", "gym", "exercise", "fitness", "walk", "run"], icon: iconDumbbell },
  { keys: ["food", "cook", "meal", "eat", "grocery"], icon: iconFood },
  { keys: ["shop", "buy", "order", "errand", "pickup"], icon: iconBags },
  { keys: ["job", "career", "travel", "office", "work"], icon: iconBriefcase },
  { keys: ["focus", "urgent", "now", "today", "asap"], icon: iconTarget },
  { keys: ["decide", "decision", "choose", "option"], icon: iconDecisions },
  { keys: ["money", "budget", "pay", "bill", "finance", "cost"], icon: iconMoney },
  { keys: ["computer", "digital", "admin", "form", "login", "account", "settings"], icon: iconComputers },
  { keys: ["friends", "family", "relationship", "social", "connect"], icon: iconConnection },
  { keys: ["study", "learn", "homework", "quiz", "exam"], icon: iconStudy },
  { keys: ["misc", "other", "random", "anything"], icon: iconMisc },
];

function pickIcon(category, index = 0) {
  // 1) Strongest: model-provided iconKey
  const iconKey = String(category?.iconKey || "").trim().toLowerCase();
  if (iconKey && ICONS_BY_KEY[iconKey]) return ICONS_BY_KEY[iconKey];

  // 2) Strong: stable category id mapping
  const id = String(category?.id || "").trim().toLowerCase();
  if (id && ICON_BY_ID[id]) return ICON_BY_ID[id];

  // 3) Fallback: keyword match on title/subtitle/id
  const haystack = `${category?.title || ""} ${category?.subtitle || ""} ${id}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((k) => haystack.includes(k))) return rule.icon;
  }

  // 4) Deterministic fallback
  const fallback = [iconTarget, iconDecisions, iconMoney, iconComputers];
  return fallback[index] || iconMisc;
}

// Soft tint per card
function tintFromIndex(i) {
  const tints = [
    { bg: "rgba(142,172,205,0.22)" },
    { bg: "rgba(222,229,212,0.30)" },
    { bg: "rgba(254,249,217,0.35)" },
    { bg: "rgba(210,224,251,0.30)" },
  ];
  return tints[i % tints.length];
}

export default function Breakdown() {
  const location = useLocation();
  const navigate = useNavigate();

  const intake = useMemo(() => {
    if (location.state && typeof location.state === "object" && location.state?.task) return location.state;
    const saved = localStorage.getItem(INTAKE_KEY);
    return saved ? safeParse(saved) : null;
  }, [location.state]);

  useEffect(() => {
    if (intake) localStorage.setItem(INTAKE_KEY, JSON.stringify(intake));
  }, [intake]);

  const task = intake?.task ?? "";
  const energy = intake?.energy ?? "medium";
  const sensory = intake?.sensory ?? "medium";
  const sig = useMemo(() => getSig({ task, energy, sensory }), [task, energy, sensory]);

  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  const [themes, setThemes] = useState(() => {
    const cached = localStorage.getItem(THEMES_KEY);
    return cached ? safeParse(cached) : null;
  });

  const categories = Array.isArray(themes?.categories) ? themes.categories : [];
  const headline = themes?.headline ?? "Your main focus areas.";
  const subhead = themes?.subhead ?? "Pick one to start. We’ll take it step by step.";

  // show/hide completed
  const [showCompleted, setShowCompleted] = useState(false);

  // progress from localStorage
  const progress = useMemo(() => {
    const p = loadProgress(sig);
    const perCat = p?.perCategory || {};
    const completedCategories = Object.values(perCat).filter((v) => v?.status === "completed").length;
    return { perCat, completedCategories };
  }, [sig]);

  // Ensure totalSteps exists (for completeness; not displayed anymore)
  useEffect(() => {
    if (!categories.length) return;
    const current = loadProgress(sig);
    const totalSteps = categories.reduce((sum, c) => sum + (Number(c?.stepsCount) || 0), 0);

    if (!current || Number(current.totalSteps || 0) !== totalSteps) {
      const next = {
        completedSteps: Number(current?.completedSteps || 0),
        totalSteps,
        perCategory: current?.perCategory || {},
      };
      saveProgress(sig, next);
    }
  }, [sig, categories]);

  useEffect(() => {
    if (!task) {
      setLoading(false);
      setError("Missing your input. Please go back and try again.");
      return;
    }

    const cachedSig = localStorage.getItem(THEMES_SIG_KEY);
    const cachedThemes = localStorage.getItem(THEMES_KEY);

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
  }, [task, energy, sensory, sig]);

  const categoriesLeftLabel = useMemo(() => {
    const total = categories.length || 0;
    const done = progress.completedCategories || 0;
    const left = Math.max(0, total - done);
    if (!total) return "";
    return `${left}/${total} categories left`;
  }, [categories.length, progress.completedCategories]);

  const visibleCategories = useMemo(() => {
    if (showCompleted) return categories;
    return categories.filter((c) => {
      const catId = String(c?.id || "");
      const catProg = progress.perCat?.[catId];
      return catProg?.status !== "completed";
    });
  }, [categories, showCompleted, progress.perCat]);

  const handlePick = async (category) => {
    if (!task) return;

    const catId = String(category?.id || "");
    const currentProg = loadProgress(sig) || { completedSteps: 0, totalSteps: 0, perCategory: {} };
    const catProg = currentProg?.perCategory?.[catId];

    // If completed, ignore
    if (catProg?.status === "completed") return;

    // If user previously started this category and we have saved tasks, resume WITHOUT regenerating.
    if (Array.isArray(catProg?.tasks) && catProg.tasks.length > 0) {
      navigate("/focus", {
        state: {
          tasks: catProg.tasks,
          title: catProg.title || category.title,
          restSuggestion: catProg.restSuggestion ?? null,
          selectedCategory: { ...category, stepsCount: Number(category?.stepsCount) || catProg.tasks.length },
          intake: { task, energy, sensory },
          sig,
        },
      });
      return;
    }

    // Otherwise generate fresh steps
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
          stepsCount: category?.stepsCount,
          category: {
            id: category?.id,
            title: category?.title,
            subtitle: category?.subtitle,
            iconKey: category?.iconKey,
          },
        }),
      });

      const text = await resp.text();
      if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);

      const json = safeParse(text);
      const steps = Array.isArray(json?.steps) ? json.steps : [];

      const tasksForFocus = steps.map((s, idx) => ({
        id: `s_${idx + 1}`,
        text: String(s?.title ?? `Step ${idx + 1}`),
        detail: String(s?.detail ?? ""),
        done: false,
      }));

      // Initialize per-category progress WITH tasks so we can resume later
      if (!currentProg.perCategory) currentProg.perCategory = {};
      currentProg.perCategory[catId] = {
        doneSteps: 0,
        totalSteps: Number(category?.stepsCount) || tasksForFocus.length,
        status: "active",
        tasks: tasksForFocus,
        title: String(json?.title ?? category.title),
        restSuggestion: json?.restSuggestion ?? null,
      };

      // Recompute global completedSteps from perCategory
      const completedSteps = Object.values(currentProg.perCategory).reduce(
        (sum, v) => sum + Number(v?.doneSteps || 0),
        0
      );
      currentProg.completedSteps = completedSteps;

      saveProgress(sig, currentProg);

      navigate("/focus", {
        state: {
          tasks: tasksForFocus,
          title: json?.title ?? category.title,
          restSuggestion: json?.restSuggestion ?? null,
          selectedCategory: { ...category, stepsCount: Number(category?.stepsCount) || tasksForFocus.length },
          intake: { task, energy, sensory },
          sig,
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
          <header className="bd__header">
            <div className="bd__titleRow">
              <Link to="/" aria-label="Go back" className="bd__backInline">
                ←
              </Link>
              <h1 className="bd__title">{headline}</h1>
            </div>

            <p className="bd__sub">{subhead}</p>

            {categories.length > 0 && (
              <div className="bd__topMetaRow">
                <div className="bd__metaPill">{categoriesLeftLabel}</div>
                <button type="button" className="bd__toggle" onClick={() => setShowCompleted((v) => !v)}>
                  {showCompleted ? "Hide completed" : "Show completed"}
                </button>
              </div>
            )}
          </header>

          <section className="bd__panel" aria-label="Categories">
            {loading ? (
              <div className="bd__loadingWrap" role="status" aria-live="polite" aria-label="Loading categories">
                <img src={loadingGif} alt="Loading" className="bd__loadingGif" />
                <div className="bd__loadingText">Loading your focus cards…</div>
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
                {/* ✅ Keep simple "Creating steps..." text (no gif) */}
                {picking && <div className="bd__status">Creating steps…</div>}

                <div className="bd__grid">
                  {visibleCategories.map((c, idx) => {
                    const tint = tintFromIndex(idx);
                    const iconSrc = pickIcon(c, idx);

                    const catId = String(c?.id || "");
                    const catProg = progress.perCat?.[catId];
                    const isDone = catProg?.status === "completed";
                    const doneSteps = Number(catProg?.doneSteps || 0);
                    const totalSteps = Number(catProg?.totalSteps || c?.stepsCount || 0);

                    return (
                      <button
                        key={c.id ?? idx}
                        type="button"
                        disabled={picking || isDone}
                        onClick={() => handlePick(c)}
                        className={`bd__card ${isDone ? "bd__card--done" : ""}`}
                      >
                        <div className="bd__topRow">
                          <div className="bd__iconWrap" aria-hidden="true" style={{ background: tint.bg }}>
                            <img src={iconSrc} alt="" className="bd__iconBig" loading="lazy" />
                          </div>
                        </div>

                        <div className="bd__text">
                          <div className="bd__cardTitle">{c.title}</div>
                          <div className="bd__cardSub">{c.subtitle || " "}</div>
                        </div>

                        <div className="bd__metaRow">
                          {isDone ? (
                            <div className="bd__pill bd__pill--done">Done</div>
                          ) : (
                            <div className="bd__pill">
                              {doneSteps > 0 ? `${doneSteps}/${totalSteps || c.stepsCount} done` : `${c.stepsCount} steps`}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!visibleCategories.length && categories.length > 0 && (
                  <div className="bd__allDone">
                    <div className="bd__allDoneTitle">All set.</div>
                    <div className="bd__allDoneSub">You finished everything in this plan.</div>
                    <Link to="/" className="bd__errorBtn">
                      Start a new one
                    </Link>
                  </div>
                )}
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
          background-size: 102% 102%;
          background-position: center;
          background-repeat: no-repeat;
          /* transform: scale(1.01); */
          z-index: 0;
        }

        .bd__bg::after{
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 40%,
            rgba(255,255,255,0.10),
            rgba(255,255,255,0.34)
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
          max-width: 500px;
          padding-top: 10px;
        }

        .bd__header{
          text-align: center;
          margin: 14px 0 16px;
          padding: 0 8px;
        }

        .bd__titleRow{
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .bd__backInline{
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.85);
          box-shadow: 0 10px 25px rgba(27,34,46,0.10);
          text-decoration: none;
          color: rgba(27,34,46,0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          flex: 0 0 auto;
        }

        .bd__title{
          margin: 0;
          font-size: 22px;
          font-weight: 750;
          color: rgba(27,34,46,0.90);
          letter-spacing: 0.1px;
        }

        .bd__sub{
          margin: 8px 0 0;
          font-size: 13px;
          font-weight: 550;
          color: rgba(27,34,46,0.58);
          line-height: 1.35;
        }

        .bd__topMetaRow{
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .bd__metaPill{
          font-size: 12px;
          font-weight: 800;
          color: rgba(27,34,46,0.70);
          background: rgba(255,255,255,0.70);
          border: 1px solid rgba(27,34,46,0.10);
          padding: 8px 12px;
          border-radius: 999px;
          box-shadow: 0 10px 18px rgba(27,34,46,0.06);
        }

        .bd__toggle{
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 850;
          color: rgba(27,34,46,0.58);
          text-decoration: underline;
          padding: 6px 6px;
        }

        .bd__panel{
          border-radius: 28px;
          background: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.62);
          box-shadow: 0 22px 70px rgba(27,34,46,0.10);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 16px;
        }

        .bd__status{
          font-size: 12px;
          color: rgba(27,34,46,0.58);
          margin-bottom: 10px;
          text-align: center;
        }

        .bd__grid{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: stretch;
        }

        .bd__grid > .bd__card:last-child:nth-child(odd){
          grid-column: 1 / -1;
          justify-self: center;
          max-width: calc((100% - 14px) / 2);
          width: 100%;
        }

        .bd__card{
          position: relative;
          min-height: 190px;
          border-radius: 26px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.90);
          box-shadow: 0 16px 34px rgba(27,34,46,0.12);
          padding: 14px;
          text-align: left;
          cursor: pointer;

          display: flex;
          flex-direction: column;
          gap: 12px;

          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 160ms ease;
          width: 100%;
        }

        .bd__card:hover{
          transform: translateY(-2px);
          box-shadow: 0 22px 44px rgba(27,34,46,0.14);
          background: rgba(255,255,255,0.90);
        }

        .bd__card:active{
          transform: translateY(0px) scale(0.99);
        }

        .bd__card:disabled{
          cursor: not-allowed;
        }

        .bd__card--done{
          opacity: 0.55;
          background: rgba(255,255,255,0.55);
        }

        .bd__topRow{
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bd__iconWrap{
          width: 92px;
          height: 92px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 26px rgba(27,34,46,0.08);
          transform: scale(1.06);
          filter: saturate(1.05) contrast(1.05);
        }

        .bd__iconBig{
          width: 84px;
          height: 84px;
          object-fit: contain;
          filter: saturate(1.05) contrast(1.05);
        }

        .bd__text{
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bd__cardTitle{
          font-size: 15px;
          font-weight: 820;
          color: rgba(27,34,46,0.88);
          line-height: 1.15;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bd__card--done .bd__cardTitle{
          text-decoration: line-through;
          color: rgba(27,34,46,0.55);
        }

        .bd__cardSub{
          font-size: 12px;
          font-weight: 560;
          color: rgba(27,34,46,0.58);
          line-height: 1.3;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: calc(12px * 1.3 * 2);
        }

        .bd__metaRow{
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bd__pill{
          font-size: 12px;
          font-weight: 700;
          color: rgba(27,34,46,0.72);
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(27,34,46,0.08);
          padding: 7px 10px;
          border-radius: 999px;
          box-shadow: 0 10px 18px rgba(27,34,46,0.06);
        }

        .bd__pill--done{
          font-weight: 900;
        }

        .bd__error{
          text-align: center;
          padding: 18px 10px;
        }

        .bd__errorText{
          margin: 0 0 12px;
          color: rgba(27,34,46,0.74);
          font-size: 14px;
        }

        .bd__errorBtn{
          display: inline-block;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(27,34,46,0.88);
          color: white;
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
        }

        .bd__allDone{
          text-align: center;
          margin-top: 16px;
          padding: 14px 10px 6px;
        }

        .bd__allDoneTitle{
          font-weight: 900;
          color: rgba(27,34,46,0.82);
          margin-bottom: 6px;
        }

        .bd__allDoneSub{
          font-size: 12px;
          font-weight: 650;
          color: rgba(27,34,46,0.58);
          margin-bottom: 12px;
        }

        .bd__footer{
          padding: 14px 0 18px;
          text-align: center;
        }

        .bd__hint{
          font-size: 12px;
          color: rgba(27,34,46,0.58);
        }

        @media (max-width: 390px){
          .bd__grid{ gap: 12px; }
          .bd__card{ min-height: 196px; }
          .bd__iconWrap{ width: 88px; height: 88px; border-radius: 24px; }
          .bd__iconBig{ width: 88px; height: 88px; }
          .bd__grid > .bd__card:last-child:nth-child(odd){
            max-width: calc((100% - 12px) / 2);
          }
        }

        .bd__loadingWrap{
          width: 100%;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 24px 10px;
        }

        .bd__loadingGif{
          width: 340px;
          max-width: 95%;
          height: auto;
          border-radius: 22px;
          box-shadow: 0 18px 44px rgba(27,34,46,0.14);
        }

        .bd__loadingText{
          font-size: 13px;
          font-weight: 750;
          color: rgba(27,34,46,0.60);
        }
      `}</style>
    </main>
  );
}
