"use client";

import { useState, type FormEvent } from "react";
import { NEWSLETTER_COPY } from "@/lib/constants/commerce-copy";

interface NewsletterFormProps {
  // "dark" = fondo siempre oscuro (footer). "adaptive" = sigue el tema
  // claro/oscuro del resto de la pagina (PDP, home).
  variant?: "dark" | "adaptive";
}

export default function NewsletterForm({ variant = "dark" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo registrar el email");
      }

      setStatus("done");
      setEmail("");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Error desconocido");
    }
  }

  const isDark = variant === "dark";
  const titleClass = isDark ? "text-nixon-ink" : "text-black dark:text-white";
  const subtitleClass = isDark ? "text-nixon-muted" : "text-black/60 dark:text-white/60";
  const inputClass = isDark
    ? "border-nixon-border bg-nixon-surface text-nixon-ink placeholder:text-nixon-muted focus:border-nixon-crimson"
    : "border-black/10 bg-transparent text-black placeholder:text-black/40 focus:border-red-500 dark:border-white/10 dark:text-white dark:placeholder:text-white/40";
  const buttonClass = isDark
    ? "bg-nixon-crimson hover:bg-nixon-crimson-bright"
    : "bg-red-500 hover:bg-red-600";

  if (status === "done") {
    return <p className="text-sm text-emerald-500">¡Listo! Ya estás suscripto.</p>;
  }

  return (
    <div>
      <p className={`text-sm font-semibold ${titleClass}`}>{NEWSLETTER_COPY.title}</p>
      <p className={`mt-1 text-xs ${subtitleClass}`}>{NEWSLETTER_COPY.subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Tu email"
          aria-label="Email para newsletter"
          className={`min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm focus:outline-none ${inputClass}`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${buttonClass}`}
        >
          {status === "loading" ? "..." : "Sumarme"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
