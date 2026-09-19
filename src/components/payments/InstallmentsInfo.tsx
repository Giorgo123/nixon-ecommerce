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
  variant?: "compact" | "detailed" | "card";
  className?: string;
}

// Varias tarjetas de producto en la misma página pueden pedir cuotas para el
// mismo monto (o incluso montos distintos en paralelo) al mismo tiempo. Sin
// este cache, cada <InstallmentsInfo> dispara su propio fetch aunque otro
// componente ya esté esperando la misma respuesta, multiplicando llamadas a
// /api/mercadopago/installments (y, detrás, 3 llamadas a la API de MP por
// cada una) en /products. Se comparte la MISMA promesa entre instancias con
// igual `amount` redondeado — no se toca el monto de cada tarjeta, cada una
// sigue mostrando su cuota real. El cache server-side de 30 min de la route
// ya evita pegarle a Mercado Pago de nuevo; esto solo evita pegarle al propio
// endpoint N veces en paralelo desde el navegador antes de que ese cache
// exista o se resuelva.
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min, acotado para no quedar stale en sesiones largas
const installmentsCache = new Map<
  number,
  { promise: Promise<InstallmentsResponse>; timestamp: number }
>();

function fetchInstallmentsShared(roundedAmount: number): Promise<InstallmentsResponse> {
  const cached = installmentsCache.get(roundedAmount);
  const now = Date.now();
  if (cached && now - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetch(`/api/mercadopago/installments?amount=${roundedAmount}`)
    .then((response) => {
      if (!response.ok) throw new Error("installments request failed");
      return response.json() as Promise<InstallmentsResponse>;
    })
    .catch((error) => {
      // No cachear fallas: que el próximo componente (o un retry futuro)
      // pueda volver a intentar en vez de quedar pegado a un error viejo.
      installmentsCache.delete(roundedAmount);
      throw error;
    });

  installmentsCache.set(roundedAmount, { promise, timestamp: now });
  return promise;
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

    fetchInstallmentsShared(roundedAmount)
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
  // Nos quedamos con la opción completa (no solo el número de cuotas) para
  // poder mostrar también su installmentAmount real — misma tarjeta/plan que
  // define el "hasta Nx", no un promedio ni un cálculo aparte.
  const bestInterestFreeOption =
    data?.options
      ?.filter((option) => option.interestFree)
      .reduce<InstallmentOption | null>(
        (best, option) => (!best || option.installments > best.installments ? option : best),
        null
      ) ?? null;
  const interestFreeMax = bestInterestFreeOption?.installments ?? 0;

  if (result.status === "error" || !data?.configured || !data.available || interestFreeMax === 0) {
    // Variant "card" (ProductCard): sin plan activo hoy, pero el diseño
    // tiene que sostenerse igual si en algún momento se desactivan las
    // cuotas — texto corto que no rompe la tarjeta, sin ocultar que existe
    // una opción de pago en cuotas, sin inventar un número.
    if (variant === "card") {
      return (
        <p className={`text-xs text-nixon-muted ${className}`}>
          Cuotas disponibles en el pago
        </p>
      );
    }

    if (variant === "compact") {
      return (
        <p className={`text-xs text-black/50 dark:text-white/50 ${className}`}>
          Sin cuotas sin interés vigentes en este momento — Mercado Pago define el resto de
          las opciones al pagar.
        </p>
      );
    }

    return (
      <div
        className={`rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 ${className}`}
      >
        El detalle de cuotas se confirma con tu tarjeta en el paso de pago — Mercado Pago
        aplica las promociones vigentes al momento de la compra.
      </div>
    );
  }

  // Si por algún motivo la API no trajo installmentAmount (undefined/0),
  // no mostramos un monto roto ("$0" / "$undefined") — caemos al texto sin
  // monto, que sigue siendo válido.
  const perInstallmentAmount = bestInterestFreeOption?.installmentAmount || 0;

  // Variant "card" (ProductCard): cuando SÍ hay plan sin interés activo, la
  // cuota es un dato de marca fuerte — texto propio con peso visual cerca
  // del precio, no una nota al pie. Formato directo ("3x $X sin interés",
  // sin "Hasta") porque acá se muestra la mejor opción real, no un techo
  // teórico. Sigue siendo 100% el dato real de la API, nunca inventado.
  if (variant === "card") {
    return (
      <p className={`text-sm font-bold text-nixon-crimson-bright ${className}`}>
        {interestFreeMax}x{perInstallmentAmount > 0 ? ` $${perInstallmentAmount.toLocaleString("es-AR")}` : ""} sin interés
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <p className={`text-xs font-medium text-red-500 ${className}`}>
        Hasta {interestFreeMax}x{perInstallmentAmount > 0 ? ` $${perInstallmentAmount.toLocaleString("es-AR")}` : ""} sin interés
      </p>
    );
  }

  const allIssuers = data.interestFreeIssuers ?? [];
  // Tope de emisores a listar: con muchos bancos habilitados la lista real
  // puede seguir siendo larga y desbordar la tarjeta — se corta con un
  // conteo en vez de volcar todo en una sola línea de texto.
  const MAX_ISSUERS_SHOWN = 6;
  const issuers = allIssuers.slice(0, MAX_ISSUERS_SHOWN);
  const remainingIssuers = allIssuers.length - issuers.length;

  return (
    <div
      className={`rounded-2xl border border-red-500/20 bg-red-500/5 p-5 ${className}`}
    >
      <p className="text-sm font-semibold text-black dark:text-white">
        Hasta {interestFreeMax} cuotas sin interés
        {perInstallmentAmount > 0 ? ` de $${perInstallmentAmount.toLocaleString("es-AR")}` : ""}
      </p>
      {issuers.length > 0 && (
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Con tarjetas de: {issuers.join(" · ")}
          {remainingIssuers > 0 ? ` y ${remainingIssuers} más` : ""}
        </p>
      )}
      <p className="mt-2 text-[11px] text-black/45 dark:text-white/45">
        Promoción sujeta a la oferta vigente de Mercado Pago. El detalle final se
        confirma con tu tarjeta en el paso de pago.
      </p>
    </div>
  );
}
