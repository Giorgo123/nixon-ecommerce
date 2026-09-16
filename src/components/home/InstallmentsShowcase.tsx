import InstallmentsInfo from "@/components/payments/InstallmentsInfo";

interface InstallmentsShowcaseProps {
  referenceAmount: number;
}

export default function InstallmentsShowcase({ referenceAmount }: InstallmentsShowcaseProps) {
  if (referenceAmount <= 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-black/10 bg-black/2 p-8 dark:border-white/10 dark:bg-white/2 sm:p-12">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
              Cuotas y financiación
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">
              Pagá en cuotas reales, no en promesas
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-black/60 dark:text-white/60">
              Esta información se consulta en vivo contra Mercado Pago — no es
              una lista fija que se desactualiza. Referencia sobre una compra
              de ${Math.round(referenceAmount).toLocaleString("es-AR")}.
            </p>
          </div>

          <InstallmentsInfo
            amount={referenceAmount}
            variant="detailed"
            className="w-full max-w-sm lg:w-96"
          />
        </div>
      </div>
    </section>
  );
}
