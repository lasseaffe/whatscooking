"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SparkItem {
  id: string | number;
  imageSrc: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export interface SparksCarouselProps {
  title?: string;
  subtitle?: string;
  items: SparkItem[];
  onItemClick?: (item: SparkItem) => void;
  className?: string;
}

export const SparksCarousel = React.forwardRef<HTMLDivElement, SparksCarouselProps>(
  ({ title, subtitle, items, onItemClick, className }, ref) => {
    const carouselRef = React.useRef<HTMLDivElement>(null);
    const [isAtStart, setIsAtStart] = React.useState(true);
    const [isAtEnd, setIsAtEnd] = React.useState(false);

    const scroll = (direction: "left" | "right") => {
      if (carouselRef.current) {
        const { scrollLeft, clientWidth } = carouselRef.current;
        const newScrollLeft = direction === "left" ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
        carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
      }
    };

    React.useEffect(() => {
      const checkScrollPosition = () => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          setIsAtStart(scrollLeft < 10);
          setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
        }
      };
      const currentRef = carouselRef.current;
      if (currentRef) {
        checkScrollPosition();
        currentRef.addEventListener("scroll", checkScrollPosition);
      }
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        if (currentRef) currentRef.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }, [items]);

    return (
      <section ref={ref} className={cn("w-full py-4", className)}>
        {(title || subtitle) && (
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              {title && <h2 className="text-xl font-bold">{title}</h2>}
              {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
            </div>
          </div>
        )}
        <div className="relative">
          <div ref={carouselRef} className="flex w-full space-x-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className={cn("group w-[240px] flex-shrink-0 cursor-pointer")}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                onClick={() => onItemClick?.(item)}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      src={item.imageSrc}
                    />
                    {item.badge && (
                      <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">{item.title}</h3>
                    {item.subtitle && <p className="text-xs opacity-60 mt-1">{item.subtitle}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {!isAtStart && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white shadow-md hover:bg-black/80 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {!isAtEnd && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white shadow-md hover:bg-black/80 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>
    );
  }
);
SparksCarousel.displayName = "SparksCarousel";
