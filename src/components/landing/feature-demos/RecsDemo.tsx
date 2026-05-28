'use client';
import React from 'react';
export function RecsDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes recsReveal  { 0%,25%{opacity:0;transform:translateY(5px)} 45%,75%{opacity:1;transform:translateY(0)} 90%,100%{opacity:0} }
        @keyframes recsBarFill { 0%,30%{width:0%} 55%,100%{width:var(--recs-w)} }
        @keyframes recsProfile { 0%,50%{opacity:0} 65%,90%{opacity:1} 100%{opacity:0} }
      `}</style>
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>BECAUSE YOU LOVED</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(139,38,53,0.1)', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>🥘</span>
        <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>Lamb Tagine ♥</span>
      </div>
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.3)', textAlign: 'center', letterSpacing: 1, marginBottom: 6 }}>↓ YOU&apos;LL LOVE</div>
      {[{e:'🫕',n:'Moroccan Harira',stars:4},{e:'🍲',n:'Ras el Hanout Stew',stars:5}].map(({e,n,stars},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, animation: `recsReveal 5s ease-in-out ${i*0.4}s infinite`, opacity: 0 }}>
          <span style={{ fontSize: 14 }}>{e}</span>
          <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)', flex: 1 }}>{n}</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {Array.from({length:5}).map((_,si)=>(
              <div key={si} style={{ width: 5, height: 5, borderRadius: 1, background: si < stars ? 'rgba(139,38,53,0.8)' : 'rgba(139,38,53,0.2)' }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>YOUR TASTE PROFILE</div>
      {[{l:'Spicy',w:'80%'},{l:'Comfort',w:'90%'},{l:'Quick',w:'45%'}].map(({l,w},i)=>(
        <div key={i} style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.5)' }}>{l}</span>
          <div style={{ height: 4, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,rgba(139,38,53,0.6),rgba(244,162,97,0.6))', borderRadius: 2, animation: `recsBarFill 4s ease-in-out ${i*0.3}s infinite`, ['--recs-w' as string]: w } as React.CSSProperties} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', animation: 'recsProfile 4s ease-in-out 1s infinite', opacity: 0 }}>✦ 47 recipes matched to you</div>
    </div>
  );
}
