import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Nixon Studio",
  description: "Términos y condiciones de compra en Nixon Studio.",
};

export default function TerminosYCondicionesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">Legal</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Última actualización: 21 de julio de 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-black/80 dark:text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">1. Datos del vendedor</h2>
          <p className="mt-2">
            Este sitio (nixonstudio.com.ar) es operado por <strong>Nicolás Georgetti</strong>,
            CUIT <strong>20-23497336-4</strong>, con domicilio en <strong>Villa María, Córdoba, Argentina</strong>. Podés
            contactarnos por correo a <strong>nicogeorgetti@gmail.com</strong> o por WhatsApp al{" "}
            <strong>+54 9 3535 62-7388</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">2. Aceptación de los términos</h2>
          <p className="mt-2">
            Al utilizar este sitio y realizar una compra, el usuario acepta estos Términos y
            Condiciones, la Política de Privacidad y la Política de Cambios y Devoluciones. Si no
            estás de acuerdo con alguno de estos puntos, te pedimos que no utilices el sitio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">3. Productos y precios</h2>
          <p className="mt-2">
            Los precios publicados están expresados en pesos argentinos (ARS) e incluyen los
            impuestos vigentes al momento de la publicación. Nos reservamos el derecho de modificar
            precios y stock sin previo aviso, aunque toda compra ya confirmada respeta el precio
            pagado en el momento de la transacción.
          </p>
          <p className="mt-2">
            Las imágenes de los productos son ilustrativas; pueden existir variaciones mínimas de
            color por la configuración de pantalla de cada dispositivo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">4. Proceso de compra y pago</h2>
          <p className="mt-2">
            Las compras se procesan a través de Mercado Pago. Una vez acreditado el pago, se
            confirma el pedido y se coordina el envío o la entrega según corresponda. Nos
            reservamos el derecho de cancelar una compra ante indicios de fraude, error de precio o
            falta de stock, notificando al comprador y reintegrando el pago si ya fue efectuado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">5. Envíos</h2>
          <p className="mt-2">
            El envío es <strong>gratuito a todo el país</strong>; su costo ya está incluido en el
            precio publicado de cada producto. También podés coordinar el retiro en nuestro local
            de Villa María, Córdoba, sin costo adicional. Los plazos estimados se informan durante
            el proceso de compra.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">
            6. Cambios, devoluciones y derecho de arrepentimiento
          </h2>
          <p className="mt-2">
            Consultá el detalle completo en nuestra{" "}
            <a href="/cambios-y-devoluciones" className="underline underline-offset-2 hover:text-red-500">
              Política de Cambios y Devoluciones
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">7. Propiedad intelectual</h2>
          <p className="mt-2">
            Los diseños, logos, textos e imágenes de este sitio son propiedad de Nixon Studio o de
            sus licenciantes, y no pueden ser reproducidos sin autorización previa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">8. Ley aplicable</h2>
          <p className="mt-2">
            Estos términos se rigen por las leyes de la República Argentina, en particular la Ley
            de Defensa del Consumidor N° 24.240 y sus normas complementarias. Cualquier
            controversia será sometida a los tribunales ordinarios competentes del domicilio del
            consumidor.
          </p>
        </section>
      </div>
    </main>
  );
}
