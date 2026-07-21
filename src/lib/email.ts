import { Resend } from "resend";

type OrderForEmail = {
  id: string;
  email: string;
  fullName: string;
  totalPrice: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  items: Array<{
    quantity: number;
    price: number;
    product: { name: string };
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
    .map(
      (item) =>
        `<li>${item.quantity} x ${item.product.name} — ${formatPrice(item.price * item.quantity)}</li>`
    )
    .join("");
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
        <p>Envío a: ${order.address}, ${order.city}, ${order.state} (${order.zipCode})</p>
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
        <p>Envío a: ${order.address}, ${order.city}, ${order.state} (${order.zipCode})</p>
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

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `¡Tu pago fue confirmado! Pedido #${orderRef} - Nixon Studio`,
      html: `
        <h2>¡Listo, ${order.fullName}! Tu pago fue confirmado.</h2>
        <p>Pedido #${orderRef} por ${formatPrice(order.totalPrice)}.</p>
        <ul>${itemsListHtml(order)}</ul>
        <p>Ya estamos preparando tu envío a ${order.address}, ${order.city}, ${order.state}.</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando email de pago confirmado:", error);
  }
}
