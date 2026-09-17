"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

const testimonials = [
  {
    name: "Martina R.",
    city: "CABA",
    item: "Remera oversize dark art",
    quote:
      "La tela tiene un gramaje que no se siente en otras oversize del mismo precio. Y llegó en 3 días.",
  },
  {
    name: "Tomás G.",
    city: "Córdoba",
    item: "Buzo oversize",
    quote:
      "Compré con dudas por el talle y la atención me respondió al toque por Instagram. Quedó perfecto.",
  },
  {
    name: "Julieta P.",
    city: "Rosario",
    item: "Remera oversize streetwear",
    quote: "El diseño es distinto a todo lo que vi en otros lados. Pedí 2 más para regalar.",
  },
  {
    name: "Bruno L.",
    city: "Mendoza",
    item: "Poster de aluminio",
    quote: "No esperaba que el acabado en aluminio se vea tan bien en persona. Quedó de diez en el escritorio.",
  },
  {
    name: "Camila V.",
    city: "La Plata",
    item: "Remera oversize clásica",
    quote: "Pagué en 3 cuotas sin interés y el pago fue rapidísimo con Mercado Pago.",
  },
  {
    name: "Franco D.",
    city: "CABA",
    item: "Buzo oversize Guts",
    quote: "Es mi segunda compra. La primera remera después de varios lavados sigue como el día uno.",
  },
];

// Velocidad del loop en px/segundo. A diferencia del PromoBar (duration fija
// porque el copy es corto), acá las quotes son largas y el track se mueve con
// requestAnimationFrame a velocidad constante: así el pausado por hover/focus
// corta y retoma exactamente donde quedó, sin el salto que produciría
// reiniciar un keyframe ["0%", "-50%"] a mitad de camino.
const MARQUEE_SPEED_PX_S = 40;

type Testimonial = (typeof testimonials)[number];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="w-70 shrink-0 rounded-2xl border border-black/6 bg-white p-6 dark:border-white/8 dark:bg-zinc-950 sm:w-80">
      <div className="mb-4 text-red-500">{"★★★★★"}</div>
      <blockquote className="text-sm leading-relaxed text-black/80 dark:text-white/80">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
          {testimonial.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
        <span className="text-xs text-black/60 dark:text-white/60">
          <span className="font-semibold text-black dark:text-white">{testimonial.name}</span>
          {" · "}
          {testimonial.city}
          <br />
          {testimonial.item}
        </span>
      </figcaption>
    </figure>
  );
}

// Loop continuo tipo marquee (mismo patrón que PromoBar.tsx: contenido
// duplicado una vez para que el ciclo sea perfecto). Se pausa en hover/focus
// porque acá son quotes de texto largas, no un banner corto: necesitan
// tiempo de lectura sin competir contra el movimiento.
function TestimonialMarquee() {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [loopWidth, setLoopWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => setLoopWidth(track.scrollWidth / 2);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (isPaused || loopWidth === 0) return;
    let next = x.get() - (MARQUEE_SPEED_PX_S * delta) / 1000;
    if (next <= -loopWidth) {
      next += loopWidth;
    }
    x.set(next);
  });

  const loopedTestimonials = [...testimonials, ...testimonials];

  return (
    <div
      className="-mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <motion.div ref={trackRef} className="flex w-max gap-4 pb-4" style={{ x }}>
        {loopedTestimonials.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Testimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
            En la calle
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
            Quienes ya andan con esto puesto
          </h2>
        </div>
      </div>

      {reduceMotion ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      ) : (
        <TestimonialMarquee />
      )}
    </section>
  );
}
