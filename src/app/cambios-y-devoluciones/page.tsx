export const dynamic = "force-static";

const CONTACT_EMAIL = "nicogeorgetti@gmail.com";

export default function CambiosYDevolucionesPage() {
  const withdrawalSubject = encodeURIComponent("Botón de Arrepentimiento - Solicitud de revocación de compra");
  const withdrawalBody = encodeURIComponent(
    "Hola, quiero ejercer mi derecho de arrepentimiento sobre la siguiente compra:\n\n" +
      "Número de pedido: \n" +
      "Nombre completo: \n" +
      "Email usado en la compra: \n" +
      "Fecha de compra: \n\n" +
      "Gracias."
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">Legal</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        Cambios, Devoluciones y Derecho de Arrepentimiento
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Última actualización: 21 de julio de 2026
      </p>

      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-bold text-black dark:text-white">Botón de Arrepentimiento</h2>
        <p className="mt-2 text-sm leading-6 text-black/80 dark:text-white/80">
          Como consumidor, tenés derecho a revocar tu compra dentro de los <strong>10 días
          corridos</strong> desde que recibiste el producto, sin tener que dar ningún motivo y sin
          responsabilidad alguna, conforme el Art. 34 de la Ley de Defensa del Consumidor N°
          24.240 y la Resolución 424/2020.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${withdrawalSubject}&body=${withdrawalBody}`}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          Ejercer el Botón de Arrepentimiento
        </a>
        <p className="mt-2 text-xs text-black/60 dark:text-white/60">
          Se abrirá tu programa de email con un mensaje pre-completado a {CONTACT_EMAIL}.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-sm leading-7 text-black/80 dark:text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">1. Derecho de arrepentimiento</h2>
          <p className="mt-2">
            Al tratarse de una venta a distancia, tenés derecho a revocar la compra dentro de los
            10 días corridos posteriores a la entrega del producto, sin costo ni penalidad. Para
            ejercerlo, usá el botón de arriba o escribinos a <strong>{CONTACT_EMAIL}</strong>{" "}
            indicando tu número de pedido.
          </p>
          <p className="mt-2">
            Una vez recibida tu solicitud, te vamos a indicar cómo devolver el producto. El
            reintegro del pago se realiza por el mismo medio utilizado en la compra, una vez que
            recibimos el producto en las condiciones en que fue entregado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">2. Cambios por talle o color</h2>
          <p className="mt-2">
            Si el producto no te queda o querés cambiarlo por otro talle/color disponible, escribinos
            dentro de los <strong>[N] días</strong> de recibido a {CONTACT_EMAIL} indicando tu
            número de pedido. [Completar: quién cubre el costo de envío del cambio, condiciones del
            producto para aceptar el cambio (sin uso, con etiquetas, etc.).]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">3. Producto con fallas</h2>
          <p className="mt-2">
            Si tu producto llegó con una falla de fabricación, contactanos a {CONTACT_EMAIL} con
            fotos del problema y tu número de pedido. Vas a tener garantía legal conforme la Ley de
            Defensa del Consumidor, y resolvemos el cambio o reintegro sin costo para vos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">4. Productos excluidos</h2>
          <p className="mt-2">
            [Completar si aplica: por ejemplo, productos personalizados o hechos a pedido pueden
            estar excluidos del derecho de cambio por talle/color, aunque el derecho de
            arrepentimiento de 10 días corridos igualmente aplica por ley salvo excepciones
            expresamente previstas en el Art. 34 de la Ley 24.240.]
          </p>
        </section>
      </div>
    </main>
  );
}
