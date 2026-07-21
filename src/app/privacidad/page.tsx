export const dynamic = "force-static";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-red-500">Legal</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Última actualización: [FECHA]
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-black/80 dark:text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">1. Responsable del tratamiento</h2>
          <p className="mt-2">
            <strong>[RAZÓN SOCIAL / NOMBRE COMPLETO]</strong>, CUIT <strong>[CUIT]</strong>, es
            responsable de los datos personales que se recaban a través de nixonstudio.com.ar.
            Ante cualquier consulta podés escribirnos a <strong>[EMAIL DE CONTACTO]</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">2. Qué datos recopilamos</h2>
          <p className="mt-2">
            Cuando realizás una compra o te contactás con nosotros, podemos recopilar: nombre y
            apellido, email, teléfono, dirección de envío y facturación. El pago se procesa
            directamente por Mercado Pago; nosotros no almacenamos números de tarjeta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">3. Para qué usamos tus datos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Procesar y entregar tu pedido.</li>
            <li>Comunicarnos con vos sobre el estado de tu compra.</li>
            <li>Cumplir obligaciones legales e impositivas.</li>
            <li>Mejorar la experiencia del sitio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">4. Con quién compartimos tus datos</h2>
          <p className="mt-2">
            Compartimos los datos estrictamente necesarios con Mercado Pago (para procesar el
            pago) y con la empresa de transporte/logística (para la entrega). No vendemos ni
            cedemos tus datos a terceros con fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">5. Tus derechos</h2>
          <p className="mt-2">
            De acuerdo a la Ley N° 25.326 de Protección de Datos Personales, podés ejercer tu
            derecho de acceso, rectificación, actualización o supresión de tus datos escribiendo a{" "}
            <strong>[EMAIL DE CONTACTO]</strong>. La Agencia de Acceso a la Información Pública, en
            su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender
            las denuncias y reclamos que se interpongan con relación al incumplimiento de las
            normas sobre protección de datos personales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-black dark:text-white">6. Cookies</h2>
          <p className="mt-2">
            Usamos almacenamiento local del navegador para recordar el contenido de tu carrito de
            compras. No utilizamos cookies de terceros con fines publicitarios más allá de las que
            puedan establecer Mercado Pago durante el proceso de pago.
          </p>
        </section>
      </div>
    </main>
  );
}
