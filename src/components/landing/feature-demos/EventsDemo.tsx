'use client';
export function EventsDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes evCourseReveal { 0%{opacity:0;transform:translateX(-6px)} 20%,60%{opacity:1;transform:translateX(0)} 75%,100%{opacity:0} }
        @keyframes evVoteBar1     { 0%,50%{width:0%} 80%,100%{width:75%} }
        @keyframes evVoteBar2     { 0%,55%{width:0%} 80%,100%{width:25%} }
        @keyframes evWinner       { 0%,70%{opacity:0} 82%,95%{opacity:1} 100%{opacity:0} }
      `}</style>
      <div style={{ background: 'rgba(244,162,97,0.08)', border: '1px solid rgba(244,162,97,0.2)', borderRadius: 8, padding: '7px 10px', marginBottom: 8 }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.5)', marginBottom: 4 }}>🎉 DATE NIGHT · SAT 24</div>
        {[{l:'STARTER',e:'🥗',n:'Caprese',d:'0s'},{l:'MAIN',e:'🍝',n:'Cacio e Pepe',d:'0.5s'},{l:'DESSERT',e:'🍮',n:'Panna Cotta',d:'1s'}].map(({l,e,n,d})=>(
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, animation: `evCourseReveal 5s ease-in-out ${d} infinite` }}>
            <span style={{ fontSize: 7, color: 'rgba(244,162,97,0.4)', width: 40 }}>{l}</span>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>DINNER PARTY · 6 GUESTS</div>
      {[{e:'🥘',n:'Lamb Tagine',b:'evVoteBar1'},{e:'🥗',n:'Fattoush',b:'evVoteBar2'}].map(({e,n,b},i)=>(
        <div key={i} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{n}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,rgba(139,38,53,0.6),rgba(244,162,97,0.6))', borderRadius: 2, width: 0, animation: `${b} 5s ease-in-out infinite` }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.6)', animation: 'evWinner 5s ease-in-out infinite', opacity: 0 }}>✦ Scaled for 6 automatically</div>
    </div>
  );
}
