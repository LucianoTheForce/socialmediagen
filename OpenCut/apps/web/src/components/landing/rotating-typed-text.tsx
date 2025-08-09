"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

type RotatingTypedTextProps = {
  items?: string[];
  typeSpeedMs?: number;
  backSpeedMs?: number;
  holdMs?: number;
  className?: string;
  ariaLabel?: string;
};

// Accessible typewriter effect that cycles through provided prompts.
export function RotatingTypedText({
  items,
  typeSpeedMs = 40,
  backSpeedMs = 22,
  holdMs = 900,
  className,
  ariaLabel = "texto animado",
}: RotatingTypedTextProps) {
  const prompts = useMemo(
    () =>
      (items?.length ? items : [
        "carrosséis prontos para postar",
        "roteiros de vídeo envolventes",
        "títulos que convertem",
        "ideias com alta taxa de cliques",
      ]) as readonly string[],
    [items],
  );

  const [display, setDisplay] = useState("");
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const current = prompts[i % prompts.length] ?? "";

    function schedule(fn: () => void, ms: number) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(fn, ms);
    }

    if (phase === "typing") {
      if (display.length < current.length) {
        schedule(() => setDisplay(current.slice(0, display.length + 1)), typeSpeedMs);
      } else {
        schedule(() => setPhase("holding"), holdMs);
      }
    } else if (phase === "holding") {
      schedule(() => setPhase("deleting"), holdMs);
    } else {
      // deleting
      if (display.length > 0) {
        schedule(() => setDisplay(current.slice(0, display.length - 1)), backSpeedMs);
      } else {
        setPhase("typing");
        setI((prev) => (prev + 1) % prompts.length);
      }
    }

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [display, i, phase, prompts, typeSpeedMs, backSpeedMs, holdMs]);

  return (
    <span aria-label={ariaLabel} className={className}>
      {display}
      <motion.span
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        className="inline-block ml-1 w-3 h-5 bg-current align-baseline"
      />
    </span>
  );
}

export default RotatingTypedText;



