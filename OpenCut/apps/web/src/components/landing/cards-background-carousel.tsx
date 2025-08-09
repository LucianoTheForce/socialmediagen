"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
// Using native CSS aspect-ratio to avoid external deps issues

export type CardSlide = { src: string; alt: string };

type CardsBackgroundCarouselProps = {
  slides?: CardSlide[];
  currentIndex?: number;
  onIndexChange?: (i: number) => void;
  intervalMs?: number;
  autoPlay?: boolean;
};

// Card-styled background slider with perspective and animated neighbors
export function CardsBackgroundCarousel({
  slides,
  currentIndex = 0,
  onIndexChange,
  intervalMs = 3000,
  autoPlay = true,
}: CardsBackgroundCarouselProps) {
  const fallback: CardSlide[] = useMemo(
    () => [
      { src: "/open-graph/default.jpg", alt: "slide" },
      { src: "/open-graph/roadmap.jpg", alt: "slide" },
      { src: "/landing-page-bg.png", alt: "slide" },
    ],
    [],
  );

  const base = (slides?.length ? slides : fallback) as readonly CardSlide[];
  const [sources, setSources] = useState<CardSlide[]>(base as CardSlide[]);
  const [internalIndex, setInternalIndex] = useState(0);

  useEffect(() => {
    setSources(base as CardSlide[]);
  }, [base]);

  // Auto-advance index
  useEffect(() => {
    if (!autoPlay || sources.length <= 1) return;
    const id = setInterval(() => {
      if (onIndexChange) {
        onIndexChange((currentIndex + 1) % sources.length);
      } else {
        setInternalIndex((i) => (i + 1) % sources.length);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, sources.length, currentIndex, onIndexChange]);

  const getDelta = (i: number) => {
    const active = onIndexChange ? currentIndex : internalIndex;
    const n = sources.length;
    const raw = i - active;
    const wrapped = ((raw % n) + n) % n; // 0..n-1
    const alt = wrapped - n; // negative alternative
    return Math.abs(wrapped) <= Math.abs(alt) ? wrapped : alt;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* reserve safe area for header */}
      <div className="absolute inset-x-0 top-0 h-[5rem] bg-transparent" />
      <div className="absolute inset-x-0 top-[14vh] flex justify-center" style={{ perspective: 1200 }}>
        <div className="relative h-[58vh] w/full max-w-[1600px]">
          {sources.map((s, i) => {
            const d = getDelta(i);
            const visible = Math.abs(d) <= 2; // show 5 cards total
            const cardWidthVh = 40; // controls size (vh)
            const gapVh = 6; // spacing between cards (vh)
            const translateX = d * (cardWidthVh + gapVh);
            const scale = i === currentIndex ? 1.12 : 0.94;
            const rotateY = d * -8;
            const z = 100 - Math.abs(d) * 10;
            return (
              <motion.div
                key={`${s.src}-${i}`}
                initial={false}
                animate={{
                  x: `${translateX}vh`,
                  rotateY,
                  scale,
                  opacity: visible ? 1 : 0,
                  zIndex: z,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/10 bg-white"
              >
                <div className="h-[58vh] flex items-center justify-center">
                  <div
                    className="relative"
                    style={{ width: `${cardWidthVh}vh`, aspectRatio: "9 / 16" }}
                  >
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      priority
                      sizes="(max-width: 768px) 40vh, 40vh"
                      className="object-cover"
                      onError={() => {
                        setSources((prev) => {
                          const next = [...prev];
                          next[i] = { src: "/open-graph/default.jpg", alt: "fallback" };
                          return next;
                        });
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CardsBackgroundCarousel;


