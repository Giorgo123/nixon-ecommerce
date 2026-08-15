"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseJsonResponse } from "@/lib/utils";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await parseJsonResponse(response);
        throw new Error(payload.error ?? "No se pudo iniciar sesión");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
      <div className="space-y-2">
        <label className="text-sm font-medium text-black dark:text-white" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-black dark:text-white" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
