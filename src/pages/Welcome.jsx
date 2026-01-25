import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import landingBg from "../assets/images/landing.jpg";

export default function Welcome() {
  const navigate = useNavigate();
  const [focus, setFocus] = useState("");
  const [energy, setEnergy] = useState(50);
  const [sensory, setSensory] = useState(50);

  const labelFromValue = (v) => (v <= 33 ? "Low" : v <= 66 ? "Medium" : "High");
  const energyLabel = useMemo(() => labelFromValue(energy), [energy]);
  const sensoryLabel = useMemo(() => labelFromValue(sensory), [sensory]);

  // Auto-grow textarea
  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset to allow shrink when deleting
    el.style.height = "auto";

    // Cap growth so layout stays stable (then textarea scrolls)
    const maxPx = 200; // tweak if you want more/less growth
    const next = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${next}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
    // Keep it stable on orientation changes / address bar changes
    const onResize = () => resizeTextarea();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute height whenever focus changes
  useLayoutEffect(() => {
    resizeTextarea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);
  const handleBreakDown = async () => {
  const res = await fetch("/api/breakdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: focus.trim(),
      energy: energyLabel.toLowerCase(),
      sensory: sensoryLabel.toLowerCase(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Breakdown failed:", text);
    return;
  }

  const data = await res.json();
  console.log("AI result:", data);

  // ✅ refresh-safe fallback
  localStorage.setItem("lastBreakdown", JSON.stringify(data));

  // ✅ pass to Breakdown page
  navigate("/breakdown", { state: data });
};

  return (
    <main className="welcome" aria-label="Welcome page">
      {/* Background */}
      <div
        className="welcome__bg"
        aria-hidden="true"
        style={{ backgroundImage: `url(${landingBg})` }}
      />

      <div className="welcome__viewport">
        <section className="welcome__content" aria-label="Welcome content">
          <header className="welcome__header">
            <div className="welcome__brandRow">
              <span className="welcome__leaf" aria-hidden="true">
                ❦
              </span>
              <h1 className="welcome__brand">Unlinear</h1>
              <span className="welcome__leaf" aria-hidden="true">
                ❦
              </span>
            </div>

            <p className="welcome__tagline">Tasks, made calmer.</p>
            <p className="welcome__sub">
              Let&apos;s break it down into <br />
              clear steps, one at a time.
            </p>
          </header>

          <div className="welcome__card" role="region" aria-label="Task helper">
            <h2 className="welcome__question">What would you like to focus on?</h2>

            {/* Starts small, grows with content */}
            <label className="welcome__pill welcome__pill--textarea" aria-label="Focus input">
              <textarea
                ref={textareaRef}
                className="welcome__textarea"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Dump what's on your mind..."
                rows={2} // starts small
              />
            </label>

            <div className="welcome__sliderBlock">
              <div className="welcome__sliderHeader">
                <span className="welcome__sliderTitle">Energy level</span>
                <span className="welcome__chip" aria-hidden="true">
                  {energyLabel}
                </span>
              </div>

              <input
                className="welcome__range"
                type="range"
                min="0"
                max="100"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                aria-label="Energy level"
              />

              <div className="welcome__ends">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="welcome__sliderBlock">
              <div className="welcome__sliderHeader">
                <span className="welcome__sliderTitle">Sensory tolerance</span>
                <span className="welcome__chip" aria-hidden="true">
                  {sensoryLabel}
                </span>
              </div>

              <input
                className="welcome__range"
                type="range"
                min="0"
                max="100"
                value={sensory}
                onChange={(e) => setSensory(Number(e.target.value))}
                aria-label="Sensory tolerance"
              />

              <div className="welcome__ends">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <button
            className="welcome__cta"
            type="button"
            onClick={handleBreakDown}
            disabled={!focus.trim()}
            aria-disabled={!focus.trim()}
            >
            Break it down
            </button>
          </div>
        </section>
      </div>

      <style>{`
        :root{
          --c1: #D2E0FB;
          --c2: #FEF9D9;
          --c3: #DEE5D4;
          --c4: #8EACCD;

          --ink: rgba(27, 34, 46, 0.92);
          --muted: rgba(27, 34, 46, 0.62);

          --shadow: 0 22px 70px rgba(27, 34, 46, 0.14);
          --radius: 26px;
        }

        *{ box-sizing: border-box; }

        .welcome{
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100svh;
          overflow: hidden;
        }

        .welcome__bg{
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: scale(1.01);
          z-index: 0;
        }

        .welcome__bg::after{
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 55%,
            rgba(255,255,255,0.08),
            rgba(255,255,255,0.22)
          );
        }

        .welcome__viewport{
          position: relative;
          z-index: 1;
          height: 100%;
          width: 100%;

          display: flex;
          align-items: flex-start;
          justify-content: center;

          padding:
            max(10px, env(safe-area-inset-top))
            18px
            max(14px, env(safe-area-inset-bottom))
            18px;

          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .welcome__content{
          width: 100%;
          max-width: 480px;

          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

          gap: 38px;
          padding-top: 15px;
        }

        .welcome__header{ margin-top: 0; }

        .welcome__brandRow{
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .welcome__leaf{
          font-size: 16px;
          color: rgba(142, 172, 205, 0.95);
          transform: translateY(-1px);
        }

        .welcome__brand{
          margin: 0;
          font-weight: 800;
          letter-spacing: 0.2px;
          font-size: clamp(30px, 8vw, 44px);
          color: var(--ink);
        }

        .welcome__tagline{
          margin-top: 13px;
          margin: 0;
          font-size: clamp(18px, 5vw, 26px);
          color: rgba(27,34,46,0.88);
          font-weight: 650;
        }

        .welcome__sub{
          margin: 6px 0 0;
          font-size: clamp(13px, 3.8vw, 18px);
          line-height: 1.35;
          color: var(--muted);
        }

        .welcome__card{
          width: 100%;
          max-width: 460px;
          margin: 0 auto;

          border-radius: var(--radius);
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(255,255,255,0.74);
          box-shadow: var(--shadow);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);

          padding: 18px;
        }

        .welcome__question{
          margin: 0 0 12px;
          font-size: clamp(16px, 4.2vw, 22px);
          color: rgba(27,34,46,0.72);
          font-weight: 800;
        }

        .welcome__pill{
          display: block;
          width: 100%;
          border-radius: 18px;
          padding: 12px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(142,172,205,0.35);
          box-shadow: 0 12px 24px rgba(27,34,46,0.10);
          margin-bottom: 12px;
        }

        .welcome__textarea{
          width: 100%;
          border: none;
          outline: none;
          resize: none;

          background: transparent;
          font-size: 16px; /* prevents iOS focus-zoom */
          line-height: 1.35;
          color: rgba(27,34,46,0.82);

          /* Start small */
          min-height: 44px;

          /* Grow smoothly; once JS caps height, it scrolls */
          overflow-y: auto;
          transition: height 120ms ease;
        }

        .welcome__textarea::placeholder{
          color: rgba(27,34,46,0.55);
        }

        .welcome__sliderBlock{
          text-align: left;
          padding: 8px 2px;
        }

        .welcome__sliderHeader{
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .welcome__sliderTitle{
          font-size: 14px;
          font-weight: 800;
          color: rgba(27,34,46,0.72);
        }

        .welcome__chip{
          display: none;
        }

        .welcome__ends{
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(27,34,46,0.55);
          padding: 0;
        }

        .welcome__range{
          width: 100%;
          height: 32px;
          background: transparent;
          -webkit-appearance: none;
          appearance: none;
        }

        .welcome__range::-webkit-slider-runnable-track{
        height: 10px;
        border-radius: 999px;
        background-color: #dee5d4;
        border: none;
        }


        .welcome__range::-webkit-slider-thumb{
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.85);
            border: 3px solid rgba(255,255,255,0.92);
            box-shadow: 0 10px 18px rgba(27,34,46,0.14);
            margin-top: -4px;
        }

        .welcome__range::-moz-range-track{
            height: 10px;
            border-radius: 999px;
            background-color: #dee5d4;
            border: none;
        }

        .welcome__range::-moz-range-thumb{
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.85);
          border: 3px solid rgba(255,255,255,0.92);
          box-shadow: 0 10px 18px rgba(27,34,46,0.14);
        }

        .welcome__cta{
          margin-top: 12px;
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 999px;
          background: black;
          color: rgba(255,255,255,0.96);
          font-size: 17px;
          font-weight: 900;
          box-shadow: 0 18px 38px rgba(27,34,46,0.14);
          cursor: pointer;
          opacity: 1;
        }

        .welcome__cta:disabled{
          cursor: not-allowed;
          opacity: 0.85;
        }
      `}</style>
    </main>
  );
}
