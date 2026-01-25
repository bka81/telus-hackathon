import React, { useMemo, useRef, useLayoutEffect, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import landingBg from "../assets/images/landing.jpg";
import logo from "../assets/images/logo.png";

function MicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

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
    el.style.height = "auto";
    const maxPx = 200;
    const next = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${next}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
    const onResize = () => resizeTextarea();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [focus]);

  // =========================
  // VOICE: Speech-to-text
  // =========================
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);

  // Neurodivergent-friendly: tolerate longer pauses before auto-ending.
  // We restart recognition if it ends unexpectedly while user still wants to talk.
  const userWantsListeningRef = useRef(false);
  const restartTimerRef = useRef(null);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const safeStart = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
    } catch {
      // Some browsers throw if start() is called while already started.
    }
  };

  const safeStop = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const supported = Boolean(SpeechRecognition);
    setSpeechSupported(supported);
    if (!supported) return;

    const rec = new SpeechRecognition();

    // Keep it listening until user stops (browser may still stop on long silence).
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-CA";

    rec.onstart = () => {
      setIsListening(true);
      setInterim("");
    };

    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }

      setInterim(interimText);

      if (finalText.trim()) {
        setFocus((prev) => {
          const needsSpace = prev && !prev.endsWith(" ");
          return (prev + (needsSpace ? " " : "") + finalText).trimStart();
        });
      }
    };

    rec.onerror = () => {
      // Stop UI + prevent restart loop on errors.
      userWantsListeningRef.current = false;
      clearRestartTimer();
      setIsListening(false);
      setInterim("");
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim("");

      // If the user still wants to be listening, restart after a gentle delay.
      // This makes long “thinking pauses” more forgiving on browsers that auto-end.
      if (userWantsListeningRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (userWantsListeningRef.current) safeStart();
        }, 650);
      }
    };

    recognitionRef.current = rec;

    return () => {
      userWantsListeningRef.current = false;
      clearRestartTimer();
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (userWantsListeningRef.current) {
      // user is stopping
      userWantsListeningRef.current = false;
      clearRestartTimer();
      safeStop();
    } else {
      // user is starting
      userWantsListeningRef.current = true;
      setInterim("");
      safeStart();
    }
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
              <img src={logo} alt="Unlinear logo" className="welcome__logo" />
              <h1 className="welcome__brand">Unlinear</h1>
            </div>

            <p className="welcome__tagline">Tasks, made calmer.</p>
            <p className="welcome__sub">
              Let&apos;s break it down into <br />
              clear steps, one at a time.
            </p>
          </header>

          <div className="welcome__card" role="region" aria-label="Task helper">
            <h2 className="welcome__question">What would you like to focus on?</h2>

            {!speechSupported && (
              <p className="welcome__hint" role="note">
                Speech input isn’t available in this browser. You can still type as usual.
              </p>
            )}

            <label className="welcome__pill welcome__pill--textarea" aria-label="Focus input">
              <div className="welcome__inputRow">
                <textarea
                  ref={textareaRef}
                  className="welcome__textarea"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Dump what's on your mind..."
                  rows={2}
                />

                {speechSupported && (
                  <button
                    type="button"
                    className={`welcome__micBtn ${isListening ? "isListening" : ""}`}
                    onClick={toggleListening}
                    aria-pressed={isListening}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                    title={isListening ? "Stop" : "Speak"}
                  >
                    <MicIcon />
                  </button>
                )}
              </div>

              {speechSupported && isListening && (
                <div className="welcome__interim" aria-live="polite">
                  {interim ? interim : "Listening… take your time."}
                </div>
              )}
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
              onClick={() => {
                const intake = {
                  task: focus.trim(),
                  energy: energyLabel.toLowerCase(),
                  sensory: sensoryLabel.toLowerCase(),
                };

                localStorage.setItem("lastIntake_v1", JSON.stringify(intake));
                navigate("/breakdown", { state: intake });
              }}
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

        .welcome__header{ margin-top: 0;}

        .welcome__brandRow{
          display: inline-flex;
          align-items: center;
          margin-bottom: 6px;
        }

        .welcome__logo{
          height: 70px;
          width: auto;
          display: block;
          transform: translateY(1px);
          margin-right: -12px;
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

        .welcome__hint{
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(27,34,46,0.60);
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

        .welcome__inputRow{
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .welcome__textarea{
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          font-size: 16px;
          line-height: 1.35;
          color: rgba(27,34,46,0.82);
          min-height: 44px;
          overflow-y: auto;
          transition: height 120ms ease;
        }

        .welcome__textarea::placeholder{
          color: rgba(27,34,46,0.55);
        }

        /* Mic button: calmer + cleaner */
        .welcome__micBtn{
          flex: 0 0 auto;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(27,34,46,0.12);
          background: rgba(255,255,255,0.55);
          box-shadow: 0 10px 18px rgba(27,34,46,0.08);
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 0;
          color: rgba(27,34,46,0.68);
        }

        .welcome__micBtn:hover{
          border-color: rgba(27,34,46,0.18);
        }

        .welcome__micBtn.isListening{
          background: rgba(0,0,0,0.88);
          border-color: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.96);
          animation: welcomePulse 1.35s ease-in-out infinite;
        }

        @keyframes welcomePulse{
          0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.22); }
          70% { box-shadow: 0 0 0 9px rgba(0,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }

        .welcome__interim{
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(142,172,205,0.18);
          font-size: 12.5px;
          font-weight: 800;
          color: rgba(27,34,46,0.58);
          text-align: left;
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
