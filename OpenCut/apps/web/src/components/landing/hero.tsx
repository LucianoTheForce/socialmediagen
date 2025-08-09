"use client";

import { motion } from "motion/react";
import { Button } from "../ui/button";
import { SponsorButton } from "../ui/sponsor-button";
import { VercelIcon } from "../icons";
import { ArrowRight } from "lucide-react";

import Image from "next/image";
import { Handlebars } from "./handlebars";
import { BackgroundCarousel } from "./background-carousel";
import { CardsBackgroundCarousel } from "./cards-background-carousel";
import { RotatingTypedText } from "./rotating-typed-text";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export function Hero() {
  const slides = useMemo(
    () => [
      { image: "/open-graph/default.jpg", text: "Crie carrosséis e vídeos com IA no GenID" },
      { image: "/open-graph/roadmap.jpg", text: "Gere textos, roteiros e artes que performam nas redes" },
      { image: "/landing-page-bg.png", text: "Publique mais rápido com templates e arrastar‑e‑soltar" },
    ],
    []
  );
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] supports-[height:100dvh]:min-h-[calc(100dvh-4.5rem)] flex flex-col justify-between items-center text-center px-4 bg-black">
      {/* Background cards under content */}
      <CardsBackgroundCarousel
        slides={[
          { src: "/posters/1ee02baaf9b6692eea4c5f506e3a908c.jpg", alt: "poster 1" },
          { src: "/posters/13c750e09541329c2799ec6260b3d8a0.jpg", alt: "poster 2" },
          { src: "/posters/34a43b2611b6f057581ff7d580b3921c.jpg", alt: "poster 3" },
          { src: "/posters/38f87284e8e081bfa3048a8da7d77395.jpg", alt: "poster 4" },
          { src: "/posters/85cb3c5e352e3064d8fb02b0b60239cd.jpg", alt: "poster 5" },
          { src: "/posters/422e1b43fdf9696bfdff244d4cb98927.jpg", alt: "poster 6" },
          { src: "/posters/459c3b7f4abd4e97db2f9198d0ce11a2.jpg", alt: "poster 7" },
          { src: "/posters/a243a9310b50f867bb566d07aeda345e.jpg", alt: "poster 8" },
          { src: "/posters/b0e972b02d96963b9db16ed18a3c508c.jpg", alt: "poster 9" },
          { src: "/posters/b6cfe9696bce4f68070dbe4c6df037a5.jpg", alt: "poster 10" },
          { src: "/posters/bd5ab08f1a4ae66d462be24060d681d5.jpg", alt: "poster 11" },
          { src: "/posters/c2f0176f6a8db4d0fb1e2c5342f07857.jpg", alt: "poster 12" },
          { src: "/posters/f4a3abb295382403e5456b9d1e94c19b.jpg", alt: "poster 13" },
          { src: "/posters/fdecd6849a094403d2862bab71f57555.jpg", alt: "poster 14" }
        ]}
        currentIndex={index}
        onIndexChange={setIndex}
        intervalMs={5000}
        autoPlay={autoPlay}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-4 flex justify-center"
        >
          <SponsorButton
            href="https://theforce.cc"
            logo={VercelIcon}
            companyName="theforce.cc"
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
                <RotatingTypedText
                  items={slides.map((s) => s.text)}
                  activeIndex={index}
                  autoRotate={false}
                  typeSpeedMs={28}
                  backSpeedMs={18}
                />
              </h1>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <Link href="/projects">
                <Button type="button" size="lg" className="px-6 h-11 text-base bg-[#6E56CF] hover:bg-[#5d48ba]">
                  Comece agora
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
          Com o GenID, você pode transformar grandes ideias em produtos de verdade. Faça brainstorm, projete e publique com sua equipe.
        </motion.p>

        {/* removed extra CTA */}
      </motion.div>

      {/* Controls */}
      <button
        type="button"
        aria-label="Anterior"
        className="absolute left-6 bottom-10 md:bottom-12 bg-white/20 hover:bg-white/30 rounded-full p-2 z-50 pointer-events-auto"
        onClick={() => go(-1)}
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button
        type="button"
        aria-label="Próximo"
        className="absolute right-6 bottom-10 md:bottom-12 bg-white/20 hover:bg-white/30 rounded-full p-2 z-50 pointer-events-auto"
        onClick={() => go(1)}
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Play / Pause & dots */}
      <div className="absolute inset-x-0 bottom-10 md:bottom-12 flex items-center justify-center gap-3 z-20">
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
