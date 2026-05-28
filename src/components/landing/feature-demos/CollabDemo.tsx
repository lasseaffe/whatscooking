'use client';
export function CollabDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes collCursor1  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes collCursor2  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-4px)} }
        @keyframes collLabel    { 0%,30%{opacity:0} 50%,80%{opacity:1} 100%{opacity:0} }
        @keyframes collVoteBar1 { 0%,40%{width:0%} 70%,100%{width:75%} }
        @keyframes collVoteBar2 { 0%,45%{width:0%} 70%,100%{width:25%} }
        @keyframes collWinner   { 0%,65%{opacity:0} 78%,95%{opacity:1} 100%{opacity:0} }
      `}</style>
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>THURSDAY PLAN · 2 EDITING</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginBottom: 6 }}>
        {[{e:'🍝'},{e:'🥗'},{e:'🍜',contested:true},{e:'🥘'}].map(({e,contested},i)=>(
          <div key={i} style={{ height: 40, borderRadius: 4, background: contested ? 'rgba(244,162,97,0.06)' : 'linear-gradient(160deg,#2a1206,#0d0604)', border: contested ? '1px solid rgba(244,162,97,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, position: 'relative' }}>
            {e}
            {contested && <>
              <div style={{ position: 'absolute', top: -8, left: 2, width: 12, height: 12, borderRadius: '50%', background: '#8B2635', border: '1px solid rgba(239,227,206,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, animation: 'collCursor1 2s ease-in-out infinite' }}>L</div>
              <div style={{ position: 'absolute', top: -8, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#2d6b3e', border: '1px solid rgba(239,227,206,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, animation: 'collCursor2 2s ease-in-out infinite' }}>S</div>
            </>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', textAlign: 'center', marginBottom: 10, animation: 'collLabel 4s ease-in-out infinite' }}>● Sara is editing Thursday</div>
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>FAMILY VOTE · FRIDAY</div>
      {[{e:'🍕',n:'Pizza Night',b:'collVoteBar1'},{e:'🍜',n:'Ramen',b:'collVoteBar2'}].map(({e,n,b},i)=>(
        <div key={i} style={{ marginBottom: 5 }}>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{e} {n}</span>
          </div>
          <div style={{ height: 5, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'rgba(139,38,53,0.6)', borderRadius: 2, width: 0, animation: `${b} 5s ease-in-out infinite` }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(139,38,53,0.7)', animation: 'collWinner 5s ease-in-out infinite', opacity: 0 }}>🏆 Pizza wins Friday!</div>
    </div>
  );
}
