"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function HeroSection() {
  const { scrollY } = useScroll();

  // Parallax effect para la imagen de fondo
  const yParallax = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacityParallax = useTransform(scrollY, [0, 500], [1, 0.3]);

  return (
    <section className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Background Image con Parallax */}
      <motion.div
        style={{ y: yParallax, opacity: opacityParallax }}
        className="absolute inset-0 w-full h-full"
      >
        <Image
          src="/hero/itachi.webp"
          alt="Nixon Studio - Dark Art Streetwear"
          fill
          priority
          quality={90}
          className="object-cover object-center"
        />
      </motion.div>

      {/* Overlay oscuro con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      {/* Efecto de luz adicional */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-radial-gradient to-transparent"
      />

      {/* Contenido Principal */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Badge de colección */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 inline-block"
        >
          <div className="rounded-full border border-red-500/50 bg-red-950/30 px-4 py-2 text-xs sm:text-sm tracking-[0.25em] text-red-300 backdrop-blur-sm">
            NUEVA COLECCIÓN 2026
          </div>
        </motion.div>

        {/* Título Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none mb-4">
            <span className="text-white drop-shadow-lg">NIXON</span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-300 bg-clip-text text-transparent drop-shadow-lg">
              STUDIO
            </span>
          </h1>
        </motion.div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-center text-base sm:text-lg lg:text-xl text-zinc-200 font-light max-w-2xl"
        >
          Remeras Oversize • Streetwear • Dark Art
          <br />
          <span className="text-sm sm:text-base text-zinc-400">
            Diseños premium con identidad propia
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 justify-center"
        >
          <motion.a
            href="/products"
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-black font-bold rounded-lg transition-all duration-300 hover:shadow-2xl flex items-center justify-center gap-2"
          >
            Ver Catálogo
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              →
            </motion.span>
          </motion.a>

          <motion.a
            href="#featured"
            whileHover={{ scale: 1.05, borderColor: "rgb(239, 68, 68)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 border-2 border-red-500/50 text-white font-bold rounded-lg backdrop-blur-sm transition-all duration-300"
          >
            Explorar Más
          </motion.a>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-xs sm:text-sm text-zinc-400 mb-3">Scroll para explorar</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
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
      </div>

      {/* Vignette Effect para oscurecer bordes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 shadow-[inset_0_0_60px_30px_rgba(0,0,0,0.4)]" />
      </div>
    </section>
  );
}