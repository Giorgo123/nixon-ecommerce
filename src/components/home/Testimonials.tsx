"use client";

import { motion, useReducedMotion } from "framer-motion";

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

export default function Testimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
            Lo que dicen
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
            Quienes ya se lo pusieron
          </h2>
        </div>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {testimonials.map((testimonial, index) => (
          <motion.figure
            key={testimonial.name}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.05 }}
            className="w-70 shrink-0 snap-start rounded-2xl border border-black/6 bg-white p-6 dark:border-white/8 dark:bg-zinc-950 sm:w-80"
          >
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
                <span className="font-semibold text-black dark:text-white">
                  {testimonial.name}
                </span>
                {" · "}
                {testimonial.city}
                <br />
                {testimonial.item}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
