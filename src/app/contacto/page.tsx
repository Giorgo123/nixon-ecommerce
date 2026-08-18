import Link from "next/link";
import type { Metadata } from "next";
import { SOCIAL_LINKS, getWhatsappUrl } from "@/lib/constants/social";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contacto y preguntas frecuentes — Nixon Studio",
  description:
    "Contactate con Nixon Studio por WhatsApp, email o Instagram, y resolvé tus dudas sobre envíos, medios de pago y cambios.",
};

const CONTACT_EMAIL = "nicogeorgetti@gmail.com";

const faqs = [
  {
    question: "¿Hacen envíos a todo el país?",
    answer:
      "Sí, el envío es gratuito a todo el país — el costo ya está incluido en el precio de cada producto.",
  },
  {
    question: "¿Puedo retirar mi pedido en Villa María?",
    answer:
      "Sí. Elegí \"Retiro en Villa María\" al finalizar la compra y te contactamos por WhatsApp o email para coordinar día y horario.",
  },
  {
    question: "¿Qué medios de pago aceptan?",
    answer:
      "Mercado Pago (tarjetas de crédito/débito, dinero en cuenta y efectivo en puntos de pago) o transferencia bancaria.",
  },
  {
    question: "¿Puedo cambiar el talle o color?",
    answer:
      "Sí, dentro de los 10 días corridos de recibido el producto. Mirá el detalle completo en Cambios y Devoluciones.",
  },
  {
    question: "¿Cuánto tarda en llegar mi pedido?",
    answer:
      "Depende del correo y la distancia hasta Villa María; te avisamos por email apenas se confirma el pago y, cuando esté disponible, el número de seguimiento del envío.",
  },
  {
    question: "No estoy seguro/a de mi talle, ¿me pueden ayudar?",
    answer: "Sí, escribinos por WhatsApp antes de comprar y te asesoramos.",
  },
];

export default function ContactoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">Ayuda</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        Contacto y preguntas frecuentes
      </h1>
      <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white/70">
        Nixon Studio — Villa María, Córdoba, Argentina.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a
          href={getWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-black/10 p-5 text-sm transition-colors hover:border-red-500/40 dark:border-white/10"
        >
          <p className="font-semibold text-black dark:text-white">WhatsApp</p>
          <p className="mt-1 text-black/60 dark:text-white/60">{SOCIAL_LINKS.whatsapp.display}</p>
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="rounded-2xl border border-black/10 p-5 text-sm transition-colors hover:border-red-500/40 dark:border-white/10"
        >
          <p className="font-semibold text-black dark:text-white">Email</p>
          <p className="mt-1 text-black/60 dark:text-white/60">{CONTACT_EMAIL}</p>
        </a>
        <a
          href={SOCIAL_LINKS.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-black/10 p-5 text-sm transition-colors hover:border-red-500/40 dark:border-white/10"
        >
          <p className="font-semibold text-black dark:text-white">Instagram</p>
          <p className="mt-1 text-black/60 dark:text-white/60">{SOCIAL_LINKS.instagram.handle}</p>
        </a>
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-lg font-semibold text-black dark:text-white">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-black/10 p-5 text-sm dark:border-white/10"
            >
              <p className="font-semibold text-black dark:text-white">{faq.question}</p>
              <p className="mt-2 leading-6 text-black/70 dark:text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-sm text-black/60 dark:text-white/60">
        Para cambios, devoluciones o el derecho de arrepentimiento, consultá{" "}
        <Link href="/cambios-y-devoluciones" className="underline underline-offset-2 hover:text-red-500">
          Cambios y Devoluciones
        </Link>
        .
      </p>
    </main>
  );
}
