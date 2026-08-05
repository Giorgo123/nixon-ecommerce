import { Resend } from "resend";

type OrderForEmail = {
  id: string;
  email: string;
  fullName: string;
  totalPrice: number;
  deliveryMethod: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  trackingInfo?: string | null;
  items: Array<{
    quantity: number;
    price: number;
    variant: { size: string | null; product: { name: string } };
  }>;
};

const FROM_EMAIL = process.env.STORE_FROM_EMAIL ?? "Nixon Studio <onboarding@resend.dev>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function itemsListHtml(order: OrderForEmail) {
  return order.items
    .map((item) => {
      const sizeLabel = item.variant.size ? ` (talle ${item.variant.size})` : "";
      return `<li>${item.quantity} x ${item.variant.product.name}${sizeLabel} — ${formatPrice(item.price * item.quantity)}</li>`;
    })
    .join("");
}

function deliveryLineHtml(order: OrderForEmail) {
  if (order.deliveryMethod === "pickup") {
    return "<p>Retiro en Villa María, Córdoba — te contactamos para coordinar.</p>";
  }
  return `<p>Envío a: ${order.address}, ${order.city}, ${order.state} (${order.zipCode})</p>`;
}

export async function sendOrderReceivedEmail(order: OrderForEmail) {
  const resend = getResendClient();
  if (!resend) return;

  const orderRef = order.id.slice(-8);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Recibimos tu pedido #${orderRef} - Nixon Studio`,
      html: `
        <h2>¡Gracias por tu compra, ${order.fullName}!</h2>
        <p>Recibimos tu pedido #${orderRef} por un total de ${formatPrice(order.totalPrice)}.</p>
        <ul>${itemsListHtml(order)}</ul>
        ${deliveryLineHtml(order)}
        <p>Te vamos a avisar en cuanto se confirme el pago.</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando email de pedido recibido:", error);
  }

  const notifyTo = process.env.STORE_NOTIFICATION_EMAIL;
  if (!notifyTo) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: notifyTo,
      subject: `Nuevo pedido #${orderRef} - ${formatPrice(order.totalPrice)}`,
      html: `
        <h2>Nuevo pedido de ${order.fullName}</h2>
        <p>Total: ${formatPrice(order.totalPrice)}</p>
        <ul>${itemsListHtml(order)}</ul>
        <p>Contacto: ${order.email}</p>
        ${deliveryLineHtml(order)}
      `,
    });
  } catch (error) {
    console.error("Error enviando email de notificación de pedido:", error);
  }
}

export async function sendPaymentConfirmedEmail(order: OrderForEmail) {
  const resend = getResendClient();
  if (!resend) return;

  const orderRef = order.id.slice(-8);
  const trackingLine = order.trackingInfo
    ? `<p>Seguimiento del envío: <strong>${order.trackingInfo}</strong></p>`
    : "";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `¡Tu pago fue confirmado! Pedido #${orderRef} - Nixon Studio`,
      html: `
        <h2>¡Listo, ${order.fullName}! Tu pago fue confirmado.</h2>
        <p>Pedido #${orderRef} por ${formatPrice(order.totalPrice)}.</p>
        <ul>${itemsListHtml(order)}</ul>
        ${
          order.deliveryMethod === "pickup"
            ? "<p>Ya podés coordinar el retiro en Villa María, Córdoba — te contactamos por WhatsApp o email.</p>"
            : `<p>Ya estamos preparando tu envío a ${order.address}, ${order.city}, ${order.state}.</p>`
        }
        ${trackingLine}
      `,
    });
  } catch (error) {
    console.error("Error enviando email de pago confirmado:", error);
  }
}

// El pago llegó después de que el TTL liberó el stock reservado y no se
// pudo re-reservar (probablemente se lo llevó otro comprador). El pago se
// confirma igual — nunca se ignora un cobro real — pero alguien tiene que
// revisarlo a mano.
export async function sendStockConflictAlertEmail(order: OrderForEmail) {
  const resend = getResendClient();
  const notifyTo = process.env.STORE_NOTIFICATION_EMAIL;
  if (!resend || !notifyTo) return;

  const orderRef = order.id.slice(-8);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: notifyTo,
      subject: `⚠️ Pedido #${orderRef} pagado sin stock disponible — revisar`,
      html: `
        <h2>Conflicto de stock en pedido pagado</h2>
        <p>El pedido #${orderRef} de ${order.fullName} (${order.email}) se pagó, pero el
        stock reservado ya había sido liberado (probablemente por demora en el pago) y
        no se pudo volver a reservar por completo.</p>
        <ul>${itemsListHtml(order)}</ul>
        <p>Revisar disponibilidad real y coordinar con el cliente si hace falta.</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando alerta de conflicto de stock:", error);
  }
}
