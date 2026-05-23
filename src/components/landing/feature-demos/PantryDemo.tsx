'use client';
export function PantryDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes pantExpiryDrain { 0%,40%{width:15%} 70%{width:5%} 100%{width:15%} }
        @keyframes pantAlertPulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pantAlertSlide  { 0%,50%{opacity:0;transform:translateY(4px)} 70%,100%{opacity:1;transform:translateY(0)} }
        @keyframes pantMatchReveal { 0%{opacity:0;transform:translateX(-8px)} 20%,75%{opacity:1;transform:translateX(0)} 90%,100%{opacity:0} }
      `}</style>
      {[
        {e:'🥛',n:'Whole Milk',w:'15%',anim:'pantExpiryDrain',c:'#e74c3c',d:'2d',pulse:true},
        {e:'🧀',n:'Cheddar',w:'45%',anim:'none',c:'#f39c12',d:'5d',pulse:false},
        {e:'🥚',n:'Eggs ×6',w:'80%',anim:'none',c:'rgba(139,38,53,0.7)',d:'12d',pulse:false}
      ].map(({e,n,w,anim,c,d,pulse},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 14 }}>{e}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{n}</div>
            <div style={{ height: 4, background: 'rgba(239,227,206,0.1)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: w, background: c, borderRadius: 2, animation: anim !== 'none' ? `${anim} 3s ease-in-out infinite` : undefined }} />
            </div>
          </div>
          <span style={{ fontSize: 8, color: c, animation: pulse ? 'pantAlertPulse 1s ease-in-out infinite' : undefined }}>{d}</span>
        </div>
      ))}
      <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 4, padding: '5px 8px', fontSize: 8, color: 'rgba(231,76,60,0.8)', animation: 'pantAlertSlide 3s ease-in-out infinite', marginBottom: 8 }}>
        ⚠ Use milk soon — 2 recipes match
      </div>
      {[{e:'🍳',n:'Shakshuka',m:'5/6',pct:'95%'},{e:'🥚',n:'French Omelette',m:'4/4',pct:'100%'}].map(({e,n,m,pct},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,38,53,0.1)', border: '1px solid rgba(139,38,53,0.2)', borderRadius: 6, padding: '5px 8px', marginBottom: 4, animation: `pantMatchReveal 4s ease-in-out ${i*0.4}s infinite` }}>
          <span style={{ fontSize: 16 }}>{e}</span>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.8)' }}>{n}</div>
            <div style={{ fontSize: 7, color: 'rgba(244,162,97,0.5)' }}>You have {m} ingredients</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(139,38,53,0.8)', fontWeight: 'bold' }}>{pct}</div>
        </div>
      ))}
    </div>
  );
}
