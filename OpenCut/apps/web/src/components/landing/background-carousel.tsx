"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";

export type BackgroundCarouselImage = {
  src: string;
  alt: string;
};

type BackgroundCarouselProps = {
  images?: BackgroundCarouselImage[];
  intervalMs?: number;
  fadeMs?: number;
  className?: string;
  // Controlled index (optional). If provided, component becomes controlled.
  currentIndex?: number;
  onIndexChange?: (nextIndex: number) => void;
  autoPlay?: boolean;
};

// Full-viewport background carousel with simple fade transition.
// Renders with aria-hidden to avoid noise for screen readers.
export function BackgroundCarousel({
  images,
  intervalMs = 3500,
  fadeMs = 800,
  className,
  currentIndex,
  onIndexChange,
  autoPlay = true,
}: BackgroundCarouselProps) {
  const fallbackImages: BackgroundCarouselImage[] = useMemo(
    () => [
      { src: "/landing-page-bg.png", alt: "Fundo placeholder 1" },
      { src: "/open-graph/default.jpg", alt: "Fundo placeholder 2" },
      { src: "/open-graph/roadmap.jpg", alt: "Fundo placeholder 3" },
    ],
    [],
  );

  const slides = (images?.length ? images : fallbackImages) as readonly BackgroundCarouselImage[];

  const isControlled = typeof currentIndex === "number";
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const index = isControlled ? (currentIndex as number) : uncontrolledIndex;

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const id = setInterval(() => {
      if (isControlled) {
        onIndexChange?.((index + 1) % slides.length);
      } else {
        setUncontrolledIndex((prev) => (prev + 1) % slides.length);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, slides.length, isControlled, index, onIndexChange]);

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none fixed inset-0 -z-50 overflow-hidden " + (className ?? "")
      }
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slides[index]?.src ?? index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeMs / 1000 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[index]?.src ?? fallbackImages[0]!.src}
            alt={slides[index]?.alt ?? "Fundo"}
            fill
            priority
            className="object-cover"
          />
          {/* subtle dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default BackgroundCarousel;



