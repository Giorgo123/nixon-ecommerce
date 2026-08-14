"use client";

import { useState, type FormEvent } from "react";
import { NEWSLETTER_COPY } from "@/lib/constants/commerce-copy";

export default function NewsletterForm() {
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

  if (status === "done") {
    return (
      <p className="text-sm text-emerald-400">¡Listo! Ya estás suscripto.</p>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-nixon-ink">{NEWSLETTER_COPY.title}</p>
      <p className="mt-1 text-xs text-nixon-muted">{NEWSLETTER_COPY.subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Tu email"
          aria-label="Email para newsletter"
          className="min-w-0 flex-1 rounded-full border border-nixon-border bg-nixon-surface px-4 py-2.5 text-sm text-nixon-ink placeholder:text-nixon-muted focus:border-nixon-crimson focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-full bg-nixon-crimson px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nixon-crimson-bright disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Sumarme"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
