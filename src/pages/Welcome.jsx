import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import landingBg from "../assets/images/landing.jpg";

export default function Welcome() {
  const navigate = useNavigate();

  const [focus, setFocus] = useState("Prepare for my doctor appointment");
  const [energy, setEnergy] = useState(70);
  const [sensory, setSensory] = useState(70);

  const labelFromValue = (v) => (v <= 33 ? "Low" : v <= 66 ? "Medium" : "High");
  const energyLabel = useMemo(() => labelFromValue(energy), [energy]);
  const sensoryLabel = useMemo(() => labelFromValue(sensory), [sensory]);

  return (
    <main className="welcome">
      <div
        className="welcome__bg"
        aria-hidden="true"
        style={{ backgroundImage: `url(${landingBg})` }}
      />

      {/* This wrapper is the key: it becomes the "viewport" for centering */}
      <div className="welcome__viewport">
        <section className="welcome__content" aria-label="Welcome">
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

            <label className="welcome__pill" aria-label="Focus input">
              <input
                className="welcome__input"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Type a task…"
              />
            </label>

            <div className="welcome__sliderBlock">
              <div className="welcome__sliderHeader">
                <span className="welcome__sliderTitle">Energy level</span>
                <span className="welcome__chip">{energyLabel}</span>
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
                <span className="welcome__chip">{sensoryLabel}</span>
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
              onClick={() =>
                navigate("/breakdown", {
                  state: { focus, energy, sensory },
                })
              }
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
          position: relative;
          width: 100vw;
          height: 100%;
          overflow: hidden;
        }

        .welcome__bg{
          position: fixed;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: scale(1.01);
          z-index: 0;
        }

        /* KEY FIX:
           Use a scrolling viewport wrapper and center inside it.
           This avoids iOS toolbar weirdness with vh/dvh/svh entirely.
        */
        .welcome__viewport{
          position: relative;
          z-index: 1;

          height: 100%;
          min-height: 100svh; /* stable "visible" height */
          width: 100%;

          display: grid;
          place-items: center;

          padding-top: max(16px, env(safe-area-inset-top));
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          padding-left: 18px;
          padding-right: 18px;

          overflow-y: auto; /* allows safety if small screens */
          -webkit-overflow-scrolling: touch;
        }

        .welcome__content{
          width: 100%;
          max-width: 480px; /* keeps optical centering on phone */
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .welcome__brandRow{
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
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
          font-size: clamp(30px, 4.2vh, 44px);
          color: var(--ink);
        }

        .welcome__tagline{
          margin: 0;
          font-size: clamp(18px, 2.6vh, 26px);
          color: rgba(27,34,46,0.88);
          font-weight: 650;
        }

        .welcome__sub{
          margin: 8px 0 0;
          font-size: clamp(13px, 2.0vh, 18px);
          line-height: 1.35;
          color: var(--muted);
        }

        .welcome__card{
          width: 100%;
          max-width: 460px;   /* optical centering */
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
          font-size: clamp(16px, 2.2vh, 22px);
          color: rgba(27,34,46,0.72);
          font-weight: 800;
        }

        .welcome__pill{
          display: block;
          width: 100%;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(142,172,205,0.35);
          box-shadow: 0 12px 24px rgba(27,34,46,0.10);
          margin-bottom: 12px;
        }

        .welcome__input{
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px; /* prevent iOS focus-zoom */
          color: rgba(27,34,46,0.82);
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
          font-size: 12px;
          font-weight: 800;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(210,224,251,0.72);
          border: 1px solid rgba(142,172,205,0.30);
          color: rgba(27,34,46,0.68);
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
          background: linear-gradient(
            90deg,
            rgba(222,229,212,0.90),
            rgba(254,249,217,0.90),
            rgba(210,224,251,0.90)
          );
          border: 1px solid rgba(142,172,205,0.25);
        }

        .welcome__range::-webkit-slider-thumb{
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(142,172,205,0.92);
          border: 3px solid rgba(255,255,255,0.92);
          box-shadow: 0 10px 18px rgba(27,34,46,0.14);
          margin-top: -4px;
        }

        .welcome__range::-moz-range-track{
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(222,229,212,0.90),
            rgba(254,249,217,0.90),
            rgba(210,224,251,0.90)
          );
          border: 1px solid rgba(142,172,205,0.25);
        }

        .welcome__range::-moz-range-thumb{
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(142,172,205,0.92);
          border: 3px solid rgba(255,255,255,0.92);
          box-shadow: 0 10px 18px rgba(27,34,46,0.14);
        }

        .welcome__cta{
          margin-top: 12px;
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(142,172,205,0.92), rgba(110,140,180,0.92));
          color: rgba(255,255,255,0.96);
          font-size: 17px;
          font-weight: 900;
          box-shadow: 0 18px 38px rgba(27,34,46,0.14);
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
