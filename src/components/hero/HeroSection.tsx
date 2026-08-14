"use client";

import { useMemo } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import type { Product } from "@/features/products/types";
import FeaturedProductSlider from "@/components/hero/FeaturedProductSlider";

interface HeroSectionProps {
  starProducts?: Product[];
}

export default function HeroSection({ starProducts = [] }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () => [
      { top: "12%", left: "8%", size: 3, duration: 9, delay: 0, x: 18, y: 28, opacity: 0.22 },
      { top: "20%", left: "82%", size: 2, duration: 11, delay: 0.8, x: -14, y: 22, opacity: 0.18 },
      { top: "34%", left: "16%", size: 4, duration: 13, delay: 1.2, x: 10, y: -18, opacity: 0.16 },
      { top: "48%", left: "74%", size: 2, duration: 10, delay: 0.4, x: -22, y: 16, opacity: 0.2 },
      { top: "58%", left: "28%", size: 3, duration: 12, delay: 1.5, x: 16, y: -24, opacity: 0.14 },
      { top: "68%", left: "86%", size: 2, duration: 14, delay: 0.9, x: -12, y: 20, opacity: 0.15 },
      { top: "76%", left: "10%", size: 4, duration: 15, delay: 0.2, x: 20, y: -14, opacity: 0.17 },
      { top: "84%", left: "58%", size: 2, duration: 11, delay: 1.1, x: -18, y: 12, opacity: 0.13 },
    ],
    []
  );

  // Parallax effect para la imagen de fondo
  const yParallax = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacityParallax = useTransform(scrollY, [0, 500], [1, 0.3]);
  const contentParallax = useTransform(scrollY, [0, 900], [0, -70]);

  const staggerContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.1,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="relative w-full h-screen overflow-hidden flex items-center justify-center">

      {/* Background Image con Parallax */}
      <motion.video
        style={{
          y: yParallax,
          opacity: opacityParallax,
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero/itachi-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/hero/itachi-optimized.webm" type="video/webm" />
        <source src="/hero/itachi-optimized.mp4" type="video/mp4" />
      </motion.video>

      {/* Overlay oscuro con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      {/* Efecto de luz adicional */}
      <motion.div
        animate={
          reduceMotion
            ? { opacity: 0.35 }
            : {
                opacity: [0.25, 0.6, 0.25],
                scale: [1, 1.04, 1],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        className="absolute inset-0 bg-radial-gradient to-transparent"
      />

      <motion.div
        animate={{
          y: [0, -12, 0],
          x: [0, 8, 0],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
        className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-red-500/20 blur-3xl"
      />

      {!reduceMotion && (
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle, index) => (
            <motion.span
              key={index}
              className="absolute rounded-full bg-black/70 shadow-[0_0_24px_rgba(0,0,0,0.45)]"
              style={{
                top: particle.top,
                left: particle.left,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                x: [0, particle.x, 0],
                y: [0, particle.y, 0],
                opacity: [particle.opacity * 0.6, particle.opacity, particle.opacity * 0.6],
                scale: [1, 1.8, 1],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              />
          ))}
        </motion.div>
      )}

      {/* Contenido Principal */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{ y: contentParallax }}
        className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.div className="flex w-full flex-col items-center justify-center">
        {/* Badge de colección */}
        <motion.div variants={fadeUp} className="mb-8 inline-block">
          <div className="rounded-full border border-red-500/50 bg-red-950/30 px-4 py-2 text-xs sm:text-sm tracking-[0.25em] text-red-300 backdrop-blur-sm">
            NUEVA COLECCIÓN 2026
          </div>
        </motion.div>

        {/* Título Principal */}
        <motion.div variants={fadeUp} className="text-center">
          <motion.h1
            animate={
              reduceMotion
                ? undefined
                : {
                    textShadow: [
                      "0 0 0px rgba(239,68,68,0)",
                      "0 0 22px rgba(239,68,68,0.25)",
                      "0 0 0px rgba(239,68,68,0)",
                    ],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none mb-4"
          >
            <span className="text-white drop-shadow-lg">NIXON</span>
            <br />
            <motion.span
              animate={
                reduceMotion
                  ? undefined
                  : {
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : { duration: 7, repeat: Infinity, ease: "easeInOut" }
              }
              className="bg-[length:200%_200%] bg-gradient-to-r from-red-400 via-red-500 to-red-300 bg-clip-text text-transparent drop-shadow-lg"
            >
              STUDIO
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Subtítulo */}
        <motion.p variants={fadeUp} className="mt-6 text-center text-base sm:text-lg lg:text-xl text-zinc-200 font-light max-w-2xl">
          Remeras Oversize • Streetwear • Dark Art
          <br />
          <span className="text-sm sm:text-base text-zinc-400">
            Diseños premium con identidad propia
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
          <motion.a
            href="/products"
            whileHover={reduceMotion ? undefined : { scale: 1.05, y: -2, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.3)" }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className="px-8 py-4 bg-white text-black font-bold rounded-lg transition-all duration-300 hover:shadow-2xl flex items-center justify-center gap-2"
          >
            Ver Catálogo
            <motion.span animate={reduceMotion ? undefined : { x: [0, 4, 0] }} transition={reduceMotion ? { duration: 0.2 } : { duration: 2, repeat: Infinity }}>
              →
            </motion.span>
          </motion.a>

          <motion.a
            href="#featured"
            whileHover={reduceMotion ? undefined : { scale: 1.05, y: -2, borderColor: "rgb(239, 68, 68)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className="px-8 py-4 border-2 border-red-500/50 text-white font-bold rounded-lg backdrop-blur-sm transition-all duration-300"
          >
            Explorar Más
          </motion.a>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={fadeUp}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-xs sm:text-sm text-zinc-400 mb-3">Scroll para explorar</p>
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
            transition={reduceMotion ? { duration: 0.2 } : { duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
        </motion.div>
      </motion.div>

      <FeaturedProductSlider products={starProducts} />

      {/* Vignette Effect para oscurecer bordes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 shadow-[inset_0_0_60px_30px_rgba(0,0,0,0.4)]" />
      </div>
    </section>
  );
}
