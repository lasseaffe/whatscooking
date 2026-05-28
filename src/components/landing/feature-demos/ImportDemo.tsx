'use client';
export function ImportDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes impExtract { 0%,35%{opacity:0;transform:translateX(-6px)} 50%,80%{opacity:1;transform:translateX(0)} 95%,100%{opacity:0} }
        @keyframes impScan    { 0%{left:-30%} 100%{left:130%} }
        @keyframes impMat     { 0%,55%{opacity:0;transform:scale(0.95)} 72%,90%{opacity:1;transform:scale(1)} 100%{opacity:0} }
      `}</style>
      <div style={{ background: 'rgba(239,227,206,0.05)', border: '1px solid rgba(244,162,97,0.2)', borderRadius: 4, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: 'rgba(244,162,97,0.4)' }}>🔗</span>
        <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.5)' }}>instagram.com/reel/C4x…</span>
      </div>
      {[{n:'Spaghetti 400g',d:'0.8s'},{n:'Guanciale 200g',d:'1.1s'},{n:'Pecorino 100g',d:'1.4s'},{n:'4 egg yolks',d:'1.7s'}].map(({n,d},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, animation: `impExtract 4s ease-in-out ${d} infinite`, opacity: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(139,38,53,0.8)', flexShrink: 0 }} />
          <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
        </div>
      ))}
      <div style={{ position: 'relative', height: 4, background: 'rgba(239,227,206,0.05)', borderRadius: 2, overflow: 'hidden', margin: '8px 0' }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', width: '30%', background: 'linear-gradient(90deg,transparent,rgba(244,162,97,0.8),transparent)', animation: 'impScan 2s ease-in-out infinite' }} />
      </div>
      <div style={{ background: 'rgba(139,38,53,0.15)', border: '1px solid rgba(139,38,53,0.3)', borderRadius: 6, padding: '6px 10px', animation: 'impMat 4s ease-in-out 1.5s infinite', opacity: 0 }}>
        <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.85)', fontStyle: 'italic' }}>Carbonara · 25 min</div>
        <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', marginTop: 2 }}>✦ Saved to My Recipes</div>
      </div>
    </div>
  );
}
