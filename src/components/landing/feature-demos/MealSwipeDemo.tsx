'use client';
export function MealSwipeDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes msSwipeRight { 0%,10%{transform:translateX(0) rotate(0deg);opacity:1} 35%{transform:translateX(60px) rotate(12deg);opacity:0} 40%{transform:translateX(-5px) rotate(-1deg);opacity:0} 55%,100%{transform:translateX(0) rotate(0deg);opacity:1} }
        @keyframes msSwipeLeft  { 0%,55%{transform:translateX(0) rotate(0deg);opacity:1} 80%{transform:translateX(-60px) rotate(-12deg);opacity:0} 85%{transform:translateX(5px) rotate(1deg);opacity:0} 100%{transform:translateX(0) rotate(0deg);opacity:1} }
        @keyframes msHeartPop   { 0%,10%{opacity:0;transform:scale(0)} 30%{opacity:1;transform:scale(1.3)} 45%,100%{opacity:0} }
        @keyframes msXPop       { 0%,55%{opacity:0;transform:scale(0)} 72%{opacity:1;transform:scale(1.3)} 85%,100%{opacity:0} }
        @keyframes msBreath     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.025)} }
      `}</style>
      <div style={{ position: 'relative', width: 80, height: 110 }}>
        <div style={{ position: 'absolute', top: 8, left: 8, width: 70, height: 96, background: 'linear-gradient(160deg,#1a0a2a,#080314)', borderRadius: 8, transform: 'rotate(-3deg)' }} />
        <div style={{ position: 'absolute', top: 4, left: 4, width: 70, height: 96, background: 'linear-gradient(160deg,#2a1206,#0d0604)', borderRadius: 8, transform: 'rotate(-1deg)', animation: 'msBreath 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 96, background: 'linear-gradient(160deg,#5a2510,#1a0a04)', borderRadius: 8, border: '1px solid rgba(244,162,97,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'msSwipeRight 4s ease-in-out infinite' }}>🥘</div>
        <div style={{ position: 'absolute', top: 10, right: -20, fontSize: 18, color: 'rgba(139,38,53,0.9)', animation: 'msHeartPop 4s ease-in-out infinite' }}>♥</div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 96, background: 'linear-gradient(160deg,#0a2a18,#051508)', borderRadius: 8, border: '1px solid rgba(244,162,97,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'msSwipeLeft 4s ease-in-out infinite' }}>🥗</div>
        <div style={{ position: 'absolute', top: 10, left: -20, fontSize: 18, color: 'rgba(200,80,80,0.8)', animation: 'msXPop 4s ease-in-out infinite' }}>✕</div>
      </div>
    </div>
  );
}
