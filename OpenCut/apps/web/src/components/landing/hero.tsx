"use client";

import { motion } from "motion/react";
import { Button } from "../ui/button";
import { SponsorButton } from "../ui/sponsor-button";
import { VercelIcon } from "../icons";
import { ArrowRight } from "lucide-react";

import Image from "next/image";
import { Handlebars } from "./handlebars";
import { BackgroundCarousel } from "./background-carousel";
import { RotatingTypedText } from "./rotating-typed-text";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export function Hero() {
  const slides = useMemo(
    () => [
      { image: "/open-graph/default.jpg", text: "Make anything possible, all in GenID" },
      { image: "/open-graph/roadmap.jpg", text: "Brainstorm, design and build with your team" },
      { image: "/landing-page-bg.png", text: "Crie carrosséis e vídeos com IA no GenID" },
    ],
    []
  );
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] supports-[height:100dvh]:min-h-[calc(100dvh-4.5rem)] flex flex-col justify-between items-center text-center px-4">
      <BackgroundCarousel
        images={slides.map((s) => ({ src: s.image, alt: "hero" }))}
        intervalMs={3000}
        currentIndex={index}
        onIndexChange={setIndex}
        autoPlay={autoPlay}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-4 flex justify-center"
        >
          <SponsorButton
            href="https://vercel.com/home?utm_source=genid"
            logo={VercelIcon}
            companyName="Vercel"
          />
        </motion.div>
        {/* Central card like Figma hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mx-auto w-full max-w-4xl"
        >
          <div className="mx-auto rounded-2xl bg-white/95 text-black shadow-xl ring-1 ring-black/5 px-6 py-6 md:px-10 md:py-8">
            <div className="text-left md:text-center">
              <h1 className="font-extrabold tracking-tight text-[2rem] md:text-[3.25rem] leading-[1.1]">
                {slides[index]?.text}
              </h1>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Link href="/projects">
                <Button type="button" size="lg" className="px-6 h-11 text-base bg-[#6E56CF] hover:bg-[#5d48ba]">
                  Get started
                  <ArrowRight className="relative z-10 ml-1 h-4 w-4 inline-block" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.p
          className="mt-8 text-sm sm:text-base text-white/90 font-normal tracking-wide max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          GenID lets you turn big ideas into real content. Brainstorm, design, and publish with your team.
        </motion.p>

        <motion.div
          className="mt-8 flex gap-8 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Link href="/projects">
            <Button
              type="submit"
              size="lg"
              className="px-6 h-11 text-base bg-foreground"
            >
              Try early beta
              <ArrowRight className="relative z-10 ml-0.5 h-4 w-4 inline-block" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Controls */}
      <button
        type="button"
        aria-label="Anterior"
        className="absolute left-6 bottom-10 md:bottom-12 bg-background/70 hover:bg-background/90 rounded-full p-2"
        onClick={() => go(-1)}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Próximo"
        className="absolute right-6 bottom-10 md:bottom-12 bg-background/70 hover:bg-background/90 rounded-full p-2"
        onClick={() => go(1)}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Play / Pause & dots */}
      <div className="absolute inset-x-0 bottom-10 md:bottom-12 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={autoPlay ? "Pausar" : "Reproduzir"}
          onClick={() => setAutoPlay((v) => !v)}
          className="ml-3 bg-background/70 hover:bg-background/90 rounded-full p-2"
        >
          {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
