'use client';
import { useEffect, useRef, useState } from 'react';

// Animated replica of cooking-mode-screen.tsx visual output.
// Does NOT import the real component — mirrors its UI with CSS keyframe animations.

const STEPS = [
  {
    num: '2 OF 6',
    duration: '~ 90 sec',
    heading: 'Toast the dried chiles',
    body: 'Place guajillo, ancho & pasilla chiles in a dry hot pan. Toast 90 seconds per side until fragrant — not burnt.',
  },
  {
    num: '3 OF 6',
    duration: '~ 5 min',
    heading: 'Blend into adobo',
    body: 'Blend toasted chiles with bone broth, cinnamon, clove & Mexican oregano until completely smooth.',
  },
];

const INGREDIENTS = [
  { label: 'Chile guajillo · 4 dried', done: true },
  { label: 'Chile ancho · 2 dried', done: true },
  { label: 'Beef short rib · 1.5kg', done: false },
  { label: 'Cinnamon · clove · oregano', done: false },
];

export function CookingModePanel() {
  const [stepIdx, setStepIdx] = useState(0);
  const [timerSec, setTimerSec] = useState(92); // 01:32
  const [thirdChecked, setThirdChecked] = useState(false);
  const [progress, setProgress] = useState(28); // %
  const [typing, setTyping] = useState(0); // chars revealed
  const [fade, setFade] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = STEPS[stepIdx];
  const bodyText = step.body;

  // Main 8s loop
  useEffect(() => {
    // Phase 1 (0–2s): typewriter
    setTyping(0);
    setFade(true);
    const typeInterval = setInterval(() => {
      setTyping(prev => {
        if (prev >= bodyText.length) { clearInterval(typeInterval); return prev; }
        return prev + 3;
      });
    }, 40);

    // Phase 2 (2–4s): timer countdown
    let t = stepIdx === 0 ? 92 : 300;
    setTimerSec(t);
    const countdownStart = setTimeout(() => {
      timerRef.current = setInterval(() => {
        t -= 1;
        setTimerSec(t);
        if (t <= (stepIdx === 0 ? 58 : 270)) {
          clearInterval(timerRef.current!);
        }
      }, 60); // fast countdown for demo
    }, 2000);

    // Phase 3 (4–6s): check third ingredient
    const checkTimer = setTimeout(() => setThirdChecked(true), 4000);

    // Phase 4 (6–7s): progress advances
    const progressTimer = setTimeout(() => setProgress(prev => prev + 17), 6000);

    // Phase 5 (7–8s): crossfade to next step
    const fadeTimer = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        setStepIdx(prev => (prev + 1) % STEPS.length);
        setThirdChecked(false);
        setProgress(prev => prev >= 60 ? 28 : prev);
        setFade(true);
      }, 300);
    }, 7000);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(countdownStart);
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(checkTimer);
      clearTimeout(progressTimer);
      clearTimeout(fadeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const mins = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const secs = String(timerSec % 60).padStart(2, '0');

  const ingredients = INGREDIENTS.map((ing, i) => ({
    ...ing,
    done: i < 2 ? true : i === 2 ? thirdChecked : false,
  }));

  return (
    <div
      style={{
        background: 'rgba(8,4,2,0.94)',
        borderLeft: '1px solid rgba(244,162,97,0.12)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Top bar — mirrors real cooking mode top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(176,125,86,0.15)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: '#B07D56', textTransform: 'uppercase' }}>
          STEP {step.num}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(239,227,206,0.6)', letterSpacing: 1 }}>
          Birria Tacos
        </span>
        <span style={{ fontSize: 10, color: 'rgba(244,162,97,0.4)' }}>✕</span>
      </div>

      {/* Progress bar — matches real 2px strip */}
      <div style={{ height: 2, background: 'rgba(176,125,86,0.15)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #C8522A, #F4A261)',
          width: `${progress}%`,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Step card — mirrors real step card */}
      <div style={{
        margin: '12px 14px 0',
        background: 'rgba(28,18,9,0.9)',
        border: '1px solid rgba(244,162,97,0.25)',
        borderRadius: 12,
        padding: '12px 14px',
        flexShrink: 0,
        opacity: fade ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.2em', color: '#B07D56', textTransform: 'uppercase' }}>
            STEP {step.num}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(244,162,97,0.8)' }}>
            {step.duration}
          </span>
        </div>
        <div style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: '#EFE3CE',
          fontFamily: 'Georgia, serif',
          marginBottom: 6,
          lineHeight: 1.3,
        }}>
          {step.heading}
        </div>
        <div style={{
          fontSize: 11,
          color: '#b0a090',
          lineHeight: 1.7,
          minHeight: 56,
        }}>
          {bodyText.slice(0, typing)}
          {typing < bodyText.length && (
            <span style={{ animation: 'cookModeBlink 0.8s step-end infinite', opacity: 1 }}>|</span>
          )}
        </div>
      </div>

      {/* Dimmed next step */}
      <div style={{
        margin: '6px 14px 0',
        background: 'rgba(20,12,6,0.6)',
        border: '1px solid rgba(244,162,97,0.1)',
        borderRadius: 10,
        padding: '8px 12px',
        opacity: 0.45,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#B07D56', textTransform: 'uppercase', marginBottom: 4 }}>
          NEXT
        </div>
        <div style={{ fontSize: 10, color: '#b0a090', lineHeight: 1.5 }}>
          {STEPS[(stepIdx + 1) % STEPS.length].heading}
        </div>
      </div>

      {/* Timer — matches real timer tray */}
      <div style={{
        margin: '10px 14px 0',
        background: 'rgba(28,18,9,0.9)',
        border: '1px solid rgba(244,162,97,0.25)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: '#8A6A4A', textTransform: 'uppercase', marginBottom: 2 }}>
            TOASTING
          </div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: '#EFE3CE',
            letterSpacing: 2,
            lineHeight: 1,
          }}>
            {mins}:{secs}
          </div>
        </div>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(244,162,97,0.15)',
          border: '1px solid rgba(244,162,97,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#F4A261',
        }}>
          ▶
        </div>
      </div>

      {/* Ingredient checklist */}
      <div style={{ margin: '10px 14px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: '#8A6A4A', textTransform: 'uppercase', marginBottom: 6 }}>
          INGREDIENTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                border: ing.done ? 'none' : '1px solid rgba(244,162,97,0.25)',
                background: ing.done ? '#828E6F' : 'transparent',
                flexShrink: 0,
                transition: 'background 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {ing.done && <span style={{ fontSize: 8, color: '#fff', lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{
                fontSize: 10,
                color: ing.done ? 'rgba(176,160,144,0.5)' : '#b0a090',
                textDecoration: ing.done ? 'line-through' : 'none',
                transition: 'color 0.4s ease',
              }}>
                {ing.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav — matches real bottom nav exactly */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 14px',
        borderTop: '1px solid rgba(244,162,97,0.1)',
        display: 'flex',
        gap: 8,
        flexShrink: 0,
        background: 'rgba(13,13,12,0.97)',
      }}>
        <button style={{
          flex: 1,
          padding: '9px 0',
          borderRadius: 8,
          background: 'rgba(244,162,97,0.12)',
          border: '1.5px solid rgba(244,162,97,0.35)',
          color: '#D4956A',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'default',
          fontFamily: 'inherit',
        }}>
          Back
        </button>
        <button style={{
          flex: 2,
          padding: '9px 0',
          borderRadius: 8,
          background: '#F4A261',
          border: 'none',
          color: '#1A0E04',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'default',
          fontFamily: 'inherit',
        }}>
          Next Step →
        </button>
      </div>

      <style>{`
        @keyframes cookModeBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
