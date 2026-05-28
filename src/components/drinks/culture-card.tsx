"use client";

import Link from "next/link";
import { CultureConfig } from "@/lib/drinks";

interface CultureCardProps {
  culture: CultureConfig;
  wide?: boolean;
}

export function CultureCard({ culture, wide = false }: CultureCardProps) {
  const photoUrl = `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(culture.photoQuery)}&sig=${culture.photoSig}`;

  return (
    <Link
      href={`/drinks/${culture.slug}`}
      className={`culture-card${wide ? " culture-card--wide" : ""}`}
      style={{ "--accent": culture.accentColor } as React.CSSProperties}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 7s ease-in-out",
        }}
        className="culture-card__photo"
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20%",
          background: culture.gradients.a,
          animation: culture.animations.a,
          willChange: "transform",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20%",
          background: culture.gradients.b,
          animation: culture.animations.b,
          willChange: "transform, opacity",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-20%",
          background: culture.gradients.c,
          animation: culture.animations.c,
          willChange: "transform",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 75%)",
        }}
      />
      <div className={`culture-card__text${wide ? " culture-card__text--wide" : ""}`}>
        <div className="culture-card__left">
          <span className="culture-card__emoji" aria-hidden>
            {culture.emoji}
          </span>
          <p className="culture-card__eyebrow">{culture.eyebrow}</p>
          <h2 className="culture-card__name">{culture.name}</h2>
          <p className="culture-card__desc">{culture.desc}</p>
        </div>
        <div className="culture-card__tags">
          {(wide ? culture.proTags : culture.proTags.slice(0, 3)).map((tag) => (
            <span key={tag} className="culture-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
