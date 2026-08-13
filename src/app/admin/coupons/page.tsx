import prisma from "@/lib/prisma";
import CouponForm from "@/components/admin/CouponForm";
import CouponRowActions from "@/components/admin/CouponRowActions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Cupones
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {coupons.length} cupón{coupons.length === 1 ? "" : "es"} creado{coupons.length === 1 ? "" : "s"}.
        </p>
      </div>

      <CouponForm />

      <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-xs uppercase tracking-wider text-black/60 dark:bg-white/5 dark:text-white/60">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Descuento</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {coupons.map((coupon) => {
              const isExpired = coupon.expiresAt ? coupon.expiresAt < new Date() : false;
              const isMaxedOut = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

              return (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-mono font-medium text-black dark:text-white">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3 text-black/70 dark:text-white/70">
                    {coupon.type === "percentage" ? `${coupon.value}%` : `$${coupon.value.toLocaleString("es-AR")}`}
                  </td>
                  <td className="px-4 py-3 text-black/70 dark:text-white/70">
                    {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                  </td>
                  <td className="px-4 py-3 text-black/70 dark:text-white/70">
                    {coupon.expiresAt ? coupon.expiresAt.toLocaleDateString("es-AR") : "Sin vencimiento"}
                  </td>
                  <td className="px-4 py-3">
                    {!coupon.active ? (
                      <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">
                        Inactivo
                      </span>
                    ) : isExpired ? (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                        Vencido
                      </span>
                    ) : isMaxedOut ? (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                        Agotado
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CouponRowActions couponId={coupon.id} couponCode={coupon.code} active={coupon.active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <p className="p-6 text-center text-sm text-black/60 dark:text-white/60">
            Todavía no creaste ningún cupón.
          </p>
        )}
      </div>
    </main>
  );
}
