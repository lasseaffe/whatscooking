'use client';
export function DiscoverDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 260, margin: '0 auto' }}>
      <style>{`
        @keyframes chipScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ddCardReveal { 0%{opacity:0;transform:scale(0.9) translateY(8px)} 20%,75%{opacity:1;transform:scale(1) translateY(0)} 90%,100%{opacity:0} }
        @keyframes trendIn { 0%{opacity:0;transform:translateX(-6px)} 15%,80%{opacity:1;transform:translateX(0)} 100%{opacity:0} }
      `}</style>
      <div style={{ overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, animation: 'chipScroll 8s linear infinite', whiteSpace: 'nowrap' }}>
          {['🇯🇵 Japanese','🇮🇹 Italian','🇲🇦 Moroccan','🇲🇽 Mexican','🇮🇳 Indian','🇹🇭 Thai','🇯🇵 Japanese','🇮🇹 Italian','🇲🇦 Moroccan','🇲🇽 Mexican'].map((c,i)=>(
            <div key={i} style={{ background: i===0?'rgba(139,38,53,0.3)':'rgba(244,162,97,0.1)', border: `1px solid ${i===0?'rgba(139,38,53,0.5)':'rgba(244,162,97,0.2)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 8, color: 'rgba(239,227,206,0.7)', flexShrink: 0 }}>{c}</div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 40, background: 'linear-gradient(90deg,transparent,#0a0503)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
        {[{e:'🍱',n:'Bento Box',s:'2.4k'},{e:'🍣',n:'Nigiri',s:'1.8k'},{e:'🍜',n:'Ramen',s:'3.1k'},{e:'🥟',n:'Gyoza',s:'1.2k'}].map(({e,n,s},i)=>(
          <div key={i} style={{ height: 60, background: 'linear-gradient(160deg,#2a1206,#0d0604)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, animation: `ddCardReveal 4s ease-in-out ${i*0.25}s infinite` }}>
            <span style={{ fontSize: 18 }}>{e}</span>
            <span style={{ fontSize: 7, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
            <span style={{ fontSize: 6, color: 'rgba(244,162,97,0.4)' }}>🔥 {s} saves</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{r:'#1',e:'🥘',n:'Lamb Tagine',s:'847'},{r:'#2',e:'🍜',n:'Pho Bo',s:'612'},{r:'#3',e:'🥗',n:'Fattoush',s:'401'}].map(({r,e,n,s},i)=>(
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, animation: `trendIn 4s ease-in-out ${i*0.35}s infinite` }}>
            <span style={{ fontSize: 9, color: 'rgba(244,162,97,0.7)', width: 14, textAlign: 'right' }}>{r}</span>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.7)', flex: 1 }}>{n}</span>
            <span style={{ fontSize: 7, color: 'rgba(244,162,97,0.4)' }}>↑ {s}/day</span>
          </div>
        ))}
      </div>
    </div>
  );
}
