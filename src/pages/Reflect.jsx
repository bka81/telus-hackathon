// reflect.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bgImage from "../assets/images/task-breakdown.jpg";

// icon imports (same set you already use)
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

const PROGRESS_KEY = "lastProgress_v1";
const THEMES_SIG_KEY = "lastThemesSig_v1";

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

const ICON_BY_ID = {
  focus_now: iconTarget,
  decisions: iconDecisions,
  money_finance: iconMoney,
  digital_admin: iconComputers,
};

function pickIconForGroup(catId, iconKey) {
  const k = String(iconKey || "").trim().toLowerCase();
  if (k && ICONS_BY_KEY[k]) return ICONS_BY_KEY[k];
  const id = String(catId || "").trim().toLowerCase();
  if (id && ICON_BY_ID[id]) return ICON_BY_ID[id];
  return iconMisc;
}

function randomQuote(seedStr) {
  const quotes = [
    "Small steps. Real momentum.",
    "You did the hard part: you followed through.",
    "Progress counts, even when it’s quiet.",
    "This is what consistency looks like.",
    "You’re building trust with yourself.",
    "Done is powerful. Keep it gentle.",
    "One category at a time. That’s the strategy.",
  ];

  const seed = String(seedStr || "") + String(Date.now());
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return quotes[h % quotes.length];
}

export default function Reflect() {
  const navigate = useNavigate();
  const location = useLocation();

  const sig = useMemo(() => {
    const s = location.state?.sig;
    if (typeof s === "string" && s) return s;
    const fallback = localStorage.getItem(THEMES_SIG_KEY);
    return typeof fallback === "string" && fallback ? fallback : null;
  }, [location.state]);

  const lastCompletedCatId = useMemo(() => {
    const v = location.state?.lastCompletedCatId;
    return typeof v === "string" ? v : "";
  }, [location.state]);

  const { groups, totals } = useMemo(() => {
    const p = sig ? loadProgress(sig) : null;
    const perCat = p?.perCategory || {};

    const completedGroups = Object.entries(perCat)
      .map(([catId, cat]) => {
        const tasks = Array.isArray(cat?.tasks) ? cat.tasks : [];
        const doneTasks = tasks.filter((t) => !!t?.done && String(t?.text || "").trim());
        const doneCount = doneTasks.length;

        const isCompleted = cat?.status === "completed" || (doneCount > 0 && doneCount === tasks.length);
        if (!isCompleted || doneCount === 0) return null;

        return {
          catId,
          title: String(cat?.title || "Completed category"),
          iconSrc: pickIconForGroup(catId, cat?.iconKey),
          doneCount,
          totalCount: tasks.length || doneCount,
          tasks: doneTasks.map((t, i) => ({
            id: String(t?.id ?? `${catId}_done_${i}`),
            text: String(t?.text || "").trim(),
          })),
        };
      })
      .filter(Boolean);

    completedGroups.sort((a, b) => {
      if (a.catId === lastCompletedCatId) return -1;
      if (b.catId === lastCompletedCatId) return 1;
      return 0;
    });

    const totalDone = completedGroups.reduce((sum, g) => sum + g.doneCount, 0);
    const totalAll = completedGroups.reduce((sum, g) => sum + g.totalCount, 0);

    return {
      groups: completedGroups,
      totals: { totalDone, totalAll },
    };
  }, [sig, lastCompletedCatId]);

  const quote = useMemo(() => randomQuote(location.key), [location.key]);

  const goBack = () => navigate("/breakdown");

  return (
    <main className="rf" aria-label="Reflection summary">
      <div className="rf__bg" aria-hidden="true" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="rf__veil" aria-hidden="true" />

      <div className="rf__viewport">
        <div className="rf__content">
          {/* ✅ Top navigation back button */}
          <div className="rf__topNav">
            <button onClick={goBack} className="rf__backBtn" type="button">
              ←
            </button>
          </div>

          <div className="rf__topBarTrack" aria-hidden="true">
            <div className="rf__topBarFill" />
          </div>

          <section className="rf__card">
            <div className="rf__badge">CATEGORY COMPLETE</div>

            <h1 className="rf__headline">You did it.</h1>
            <p className="rf__sub">{quote}</p>

            <div className="rf__statsRow" aria-label="Totals">
              <div className="rf__pill">
                {totals.totalDone}/{Math.max(totals.totalAll, totals.totalDone)} tasks finished
              </div>
              <div className="rf__pill">
                {totals.totalAll > 0 ? `${Math.round((totals.totalDone / totals.totalAll) * 100)}%` : "100%"}
              </div>
            </div>

            <div className="rf__listWrap">
              <div className="rf__listTitle">What you accomplished</div>

              {groups.length === 0 ? (
                <div className="rf__empty">No completed tasks found yet. Finish a category to see your wins here.</div>
              ) : (
                <div className="rf__groups">
                  {groups.map((g) => (
                    <div key={g.catId} className="rf__group">
                      <div className="rf__groupHeader">
                        <div className="rf__groupIconWrap" aria-hidden="true">
                          <img src={g.iconSrc} alt="" className="rf__groupIcon" />
                        </div>
                        <div className="rf__groupMeta">
                          <div className="rf__groupTitle">{g.title}</div>
                          <div className="rf__groupSub">
                            {g.doneCount}/{g.totalCount} completed
                          </div>
                        </div>
                      </div>

                      <ul className="rf__items">
                        {g.tasks.map((t) => (
                          <li key={t.id} className="rf__item">
                            <span className="rf__check" aria-hidden="true">
                              ✓
                            </span>
                            <span className="rf__itemText">{t.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="rf__btnPrimary" onClick={goBack}>
              Back to Categories
            </button>
          </section>
        </div>
      </div>

      <style>{`
        .rf{
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100svh;
          overflow: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .rf__bg{
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
          transform: scale(1.02);
        }

        .rf__veil{
          position: absolute;
          inset: 0;
          z-index: 1;
          background: radial-gradient(
            circle at 50% 35%,
            rgba(255,255,255,0.10),
            rgba(255,255,255,0.42)
          );
        }

        .rf__viewport{
          position: relative;
          z-index: 2;
          height: 100%;
          width: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding:
            max(14px, env(safe-area-inset-top))
            16px
            max(14px, env(safe-area-inset-bottom))
            16px;
        }

        .rf__content{
          width: 100%;
          max-width: 560px;
          text-align: center;
          padding-top: 12px;
        }

        /* ✅ Top back button row */
        .rf__topNav{
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;
        }

        .rf__backBtn{
          height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.90);
          box-shadow: 0 10px 22px rgba(27,34,46,0.10);
          color: rgba(27,34,46,0.82);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .rf__backBtn:active{
          transform: scale(0.97);
        }

        .rf__topBarTrack{
          width: min(560px, 92vw);
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.75);
          box-shadow: 0 10px 24px rgba(27,34,46,0.10);
          overflow: hidden;
          margin: 6px auto 18px;
        }

        .rf__topBarFill{
          width: 100%;
          height: 100%;
          border-radius: 999px;
          background: rgba(80,114,167,0.85);
        }

        .rf__card{
          width: 100%;
          background: rgba(255,255,255,0.90);
          border: 1px solid rgba(255,255,255,0.92);
          border-radius: 40px;
          box-shadow: 0 28px 80px rgba(27,34,46,0.18);
          padding: 26px 20px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .rf__badge{
          display: inline-block;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(80,114,167,0.85);
          background: rgba(210,224,251,0.60);
          border: 1px solid rgba(80,114,167,0.20);
          padding: 8px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .rf__headline{
          margin: 0;
          font-size: 34px;
          font-weight: 950;
          color: rgba(27,34,46,0.88);
          line-height: 1.08;
        }

        .rf__sub{
          margin: 10px auto 14px;
          max-width: 440px;
          font-size: 14px;
          font-weight: 650;
          color: rgba(27,34,46,0.60);
          line-height: 1.45;
        }

        .rf__statsRow{
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin: 10px 0 14px;
        }

        .rf__pill{
          font-size: 12px;
          font-weight: 900;
          color: rgba(27,34,46,0.68);
          background: rgba(255,255,255,0.70);
          border: 1px solid rgba(27,34,46,0.10);
          padding: 8px 12px;
          border-radius: 999px;
          box-shadow: 0 10px 20px rgba(27,34,46,0.08);
        }

        .rf__listWrap{
          text-align: left;
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(27,34,46,0.08);
          border-radius: 28px;
          padding: 16px;
          margin: 10px 0 16px;
        }

        .rf__listTitle{
          font-weight: 950;
          color: rgba(27,34,46,0.82);
          margin-bottom: 12px;
          font-size: 16px;
        }

        .rf__empty{
          font-size: 13px;
          font-weight: 650;
          color: rgba(27,34,46,0.55);
          padding: 10px 2px;
        }

        .rf__groups{
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .rf__group{
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(27,34,46,0.06);
          border-radius: 22px;
          padding: 12px;
        }

        .rf__groupHeader{
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .rf__groupIconWrap{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(222,229,212,0.55);
          border: 1px solid rgba(27,34,46,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 18px rgba(27,34,46,0.08);
          flex: 0 0 auto;
        }

        .rf__groupIcon{
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .rf__groupMeta{
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rf__groupTitle{
          font-weight: 950;
          color: rgba(27,34,46,0.82);
          line-height: 1.1;
        }

        .rf__groupSub{
          font-size: 12px;
          font-weight: 750;
          color: rgba(27,34,46,0.56);
        }

        .rf__items{
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rf__item{
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(27,34,46,0.07);
        }

        .rf__check{
          width: 22px;
          height: 22px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 1000;
          background: rgba(222,229,212,0.95);
          color: rgba(27,34,46,0.70);
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .rf__itemText{
          font-size: 13px;
          font-weight: 750;
          color: rgba(27,34,46,0.74);
          line-height: 1.35;
        }

        .rf__btnPrimary{
          width: 100%;
          border-radius: 999px;
          padding: 16px 16px;
          font-weight: 950;
          font-size: 18px;
          white-space: nowrap;
          background: rgba(222,229,212,0.98);
          color: rgba(27,34,46,0.78);
          border: 1px solid rgba(27,34,46,0.10);
          box-shadow: 0 18px 40px rgba(27,34,46,0.12);
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .rf__btnPrimary:active{
          transform: scale(0.98);
        }

        .rf__btnPrimary:hover{
          background: rgba(210,221,198,0.98);
        }

        .rf__footer{
          padding: 14px 0 10px;
        }

        .rf__hint{
          font-size: 12px;
          font-weight: 650;
          color: rgba(27,34,46,0.55);
          font-style: italic;
        }

        @media (max-width: 390px){
          .rf__headline{ font-size: 30px; }
          .rf__card{ border-radius: 34px; padding: 22px 16px; }
          .rf__btnPrimary{ font-size: 16px; }
        }
      `}</style>
    </main>
  );
}
