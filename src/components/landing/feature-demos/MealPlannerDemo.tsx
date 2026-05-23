'use client';
export function MealPlannerDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}>
      <style>{`
        @keyframes mpLineReveal { 0%{opacity:0;transform:translateX(-8px)} 15%,72%{opacity:1;transform:translateX(0)} 85%,100%{opacity:0} }
        @keyframes mpCellLift { 0%,45%{transform:translateY(0) scale(1)} 58%{transform:translateY(-8px) scale(1.1)} 72%,100%{transform:translateY(0) scale(1)} }
        @keyframes mpSnapIn { 0%,72%{transform:translateY(-30px) scale(0.8);opacity:0} 82%{transform:translateY(2px) scale(1.05);opacity:1} 90%,100%{transform:translateY(0) scale(1);opacity:1} }
        @keyframes mpBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 8, letterSpacing: 1, color: 'rgba(244,162,97,0.5)' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {[{e:'🍝',d:'0s'},{e:'🥘',d:'0.4s'},{e:'🥗',d:'0.8s'},{e:'🍜',d:'1.2s'}].map(({e,d},i)=>(
          <div key={i} style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#2a1206,#0d0604)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: `mpLineReveal 6s ease-in-out ${d} infinite` }}>{e}</div>
        ))}
        <div style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#3a1508,#100504)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: 'mpCellLift 6s ease-in-out 1.6s infinite' }}>🍛</div>
        <div style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#1a0a2a,#080314)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: 'mpSnapIn 6s ease-in-out 2s infinite' }}>🥩</div>
        <div style={{ height: 44, borderRadius: 4, border: '1px dashed rgba(244,162,97,0.3)', background: 'rgba(244,162,97,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(244,162,97,0.4)' }}>
          <span style={{ animation: 'mpBlink 1s step-end infinite' }}>|</span>
        </div>
      </div>
    </div>
  );
}
