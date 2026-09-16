"use client";

import { useEffect, useState } from "react";
import type { InstallmentOption } from "@/app/api/mercadopago/installments/route";

type InstallmentsResponse = {
  configured: boolean;
  available?: boolean;
  options?: InstallmentOption[];
  interestFreeIssuers?: string[];
};

type FetchResult = {
  amount: number;
  status: "ready" | "error";
  data: InstallmentsResponse | null;
};

interface InstallmentsInfoProps {
  amount: number;
  variant?: "compact" | "detailed";
  className?: string;
}

export default function InstallmentsInfo({
  amount,
  variant = "compact",
  className = "",
}: InstallmentsInfoProps) {
  const [result, setResult] = useState<FetchResult | null>(null);
  const roundedAmount = Math.round(amount);

  useEffect(() => {
    if (!roundedAmount || roundedAmount <= 0) return;

    let cancelled = false;

    fetch(`/api/mercadopago/installments?amount=${roundedAmount}`)
      .then((response) => {
        if (!response.ok) throw new Error("installments request failed");
        return response.json() as Promise<InstallmentsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setResult({ amount: roundedAmount, status: "ready", data: payload });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ amount: roundedAmount, status: "error", data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [roundedAmount]);

  const isLoading = result === null || result.amount !== roundedAmount;

  if (isLoading) {
    return (
      <div
        className={`h-4 w-40 animate-pulse rounded-full bg-black/10 dark:bg-white/10 ${className}`}
      />
    );
  }

  const data = result.data;
  const interestFreeMax =
    data?.options
      ?.filter((option) => option.interestFree)
      .reduce((max, option) => Math.max(max, option.installments), 0) ?? 0;

  if (result.status === "error" || !data?.configured || !data.available || interestFreeMax === 0) {
    if (variant === "compact") {
      return (
        <p className={`text-xs text-black/50 dark:text-white/50 ${className}`}>
          Cuotas sujetas a la oferta vigente de Mercado Pago
        </p>
      );
    }

    return (
      <div
        className={`rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 ${className}`}
      >
        Las cuotas disponibles se calculan sobre tu tarjeta en el paso de pago de
        Mercado Pago. Promociones sujetas a la oferta vigente.
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <p className={`text-xs font-medium text-red-500 ${className}`}>
        Hasta {interestFreeMax}x sin interés
      </p>
    );
  }

  const issuers = data.interestFreeIssuers ?? [];

  return (
    <div
      className={`rounded-2xl border border-red-500/20 bg-red-500/5 p-5 ${className}`}
    >
      <p className="text-sm font-semibold text-black dark:text-white">
        Hasta {interestFreeMax} cuotas sin interés
      </p>
      {issuers.length > 0 && (
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Con tarjetas de: {issuers.join(" · ")}
        </p>
      )}
      <p className="mt-2 text-[11px] text-black/45 dark:text-white/45">
        Promoción sujeta a la oferta vigente de Mercado Pago. El detalle final se
        confirma con tu tarjeta en el paso de pago.
      </p>
    </div>
  );
}
