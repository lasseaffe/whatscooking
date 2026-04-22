"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Stagger children sequentially instead of animating as one unit */
  group?: boolean;
  /** Extra delay before the reveal fires (ms) */
  delay?: number;
}

/**
 * Wraps children in an element that fades in from below when it enters
 * the viewport (Intersection Observer). Add className for extra styles.
 */
export function ScrollReveal({ children, className = "", group = false, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = delay ? setTimeout(() => el.classList.add("is-visible"), delay) : null;
          if (!delay) el.classList.add("is-visible");
          return () => { if (t) clearTimeout(t); };
        }
      },
      { threshold: 0.07, rootMargin: "0px 0px -32px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${group ? "scroll-reveal-group" : "scroll-reveal"} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
