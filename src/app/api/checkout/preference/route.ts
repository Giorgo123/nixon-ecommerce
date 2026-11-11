import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createPendingOrder,
  releaseOrderReservation,
  StockError,
  OrderValidationError,
} from "@/lib/order";
import { absoluteAssetUrl } from "@/lib/seo";
import { CouponError, allocateDiscountedUnitPrices } from "@/lib/coupon";
import { sendOrderReceivedEmail } from "@/lib/email";
import { createOrderAccessToken } from "@/lib/order-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { EXCLUDED_PAYMENT_METHODS, EXCLUDED_PAYMENT_TYPES } from "@/lib/constants/payment-methods";

type PendingOrderItem = {
  variantId: string;
  quantity: number;
  price: number;
  variant: {
    size: string | null;
    product: {
      name: string;
      description: string;
      image: string;
      category: string;
    };
  };
};

// Compensa una orden cuyo checkout no pudo completarse: libera stock y cupón
// con el mismo helper idempotente que usan el barrido de vencidas y la
// cancelación administrativa. El catch es propio para que un fallo al liberar
// no oculte el error original; si la liberación falla, el barrido programado
// la recupera.
async function releaseOrderAfterCheckoutFailure(orderId: string) {
  try {
    await releaseOrderReservation(orderId, "cancelled");
  } catch (releaseError) {
    console.error(
      "No se pudo liberar la reserva de la orden tras fallar el checkout",
      { orderId, error: releaseError }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`checkout:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN" },
        { status: 500 }
      );
    }

    const { customer, items, couponCode } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const order = await createPendingOrder({ customer, items, couponCode });

    // El token se calcula después de crear la orden y antes de llamar a
    // Mercado Pago: si falta SESSION_SECRET, se compensa la reserva y se
    // responde un error propio de checkout, no uno de conexión a MP.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    let successUrl: string;
    try {
      successUrl = `${siteUrl}/success?orderId=${order.id}&token=${createOrderAccessToken(order.id)}`;
    } catch (error) {
      console.error("No se pudo generar el token de acceso de la orden", {
        orderId: order.id,
        error,
      });
      await releaseOrderAfterCheckoutFailure(order.id);
      return NextResponse.json(
        { error: "No se pudo iniciar el checkout" },
        { status: 500 }
      );
    }

    const discountedUnitPrices = allocateDiscountedUnitPrices(
      order.items.map((item: PendingOrderItem) => ({ price: item.price, quantity: item.quantity })),
      order.discountAmount
    );

    const mpItems = order.items.map((item: PendingOrderItem, index: number) => ({
      id: item.variantId,
      title: item.variant.size
        ? `${item.variant.product.name} - Talle ${item.variant.size}`
        : item.variant.product.name,
      description: item.variant.product.description,
      picture_url: absoluteAssetUrl(item.variant.product.image),
      category_id: item.variant.product.category,
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: discountedUnitPrices[index],
    }));

    const hasExcludedPaymentMethods =
      EXCLUDED_PAYMENT_TYPES.length > 0 || EXCLUDED_PAYMENT_METHODS.length > 0;

    let response: Response;
    try {
      response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN ?? ""}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID(),
        },
        // Sin esto, si Mercado Pago no responde, esta llamada cuelga hasta el
        // timeout de la plataforma (Vercel) y el cliente nunca ve un error
        // propio — solo una pantalla en blanco que tarda hasta 60s en cortar.
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          items: mpItems,
          payer: {
            name: customer?.fullName,
            email: customer?.email,
          },
          back_urls: {
            success: successUrl,
            pending: `${siteUrl}/checkout?status=pending`,
            failure: `${siteUrl}/checkout?status=failure`,
          },
          auto_return: "approved",
          external_reference: order.id,
          ...(hasExcludedPaymentMethods && {
            payment_methods: {
              ...(EXCLUDED_PAYMENT_TYPES.length > 0 && {
                excluded_payment_types: EXCLUDED_PAYMENT_TYPES.map((id) => ({ id })),
              }),
              ...(EXCLUDED_PAYMENT_METHODS.length > 0 && {
                excluded_payment_methods: EXCLUDED_PAYMENT_METHODS.map((id) => ({ id })),
              }),
            },
          }),
        }),
      });
    } catch (fetchError) {
      await releaseOrderAfterCheckoutFailure(order.id);
      const timedOut = fetchError instanceof Error && fetchError.name === "TimeoutError";
      return NextResponse.json(
        {
          error: timedOut
            ? "Mercado Pago no respondió a tiempo. Probá de nuevo en unos minutos."
            : "No se pudo conectar con Mercado Pago",
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      // Se compensa antes de leer el body del error: si esa lectura fallara,
      // la orden ya quedó liberada igual.
      await releaseOrderAfterCheckoutFailure(order.id);
      const errorBody = await response.text();
      return NextResponse.json(
        { error: "No se pudo crear la preferencia", details: errorBody },
        { status: 502 }
      );
    }

    let preference: { init_point?: unknown };
    try {
      preference = await response.json();
    } catch {
      await releaseOrderAfterCheckoutFailure(order.id);
      return NextResponse.json(
        { error: "No se pudo crear la preferencia" },
        { status: 502 }
      );
    }

    const initPoint = preference?.init_point;
    if (typeof initPoint !== "string" || initPoint.trim() === "") {
      await releaseOrderAfterCheckoutFailure(order.id);
      return NextResponse.json(
        { error: "No se pudo crear la preferencia" },
        { status: 502 }
      );
    }

    // El mail de "pedido recibido" se manda solo aca, ya confirmado que
    // Mercado Pago devolvio un link de pago real. Si se mandaba antes y
    // esta llamada fallaba, el cliente recibia la confirmacion igual
    // aunque no pudiera pagar - quedaba confundido pensando que el pedido
    // ya estaba hecho.
    await sendOrderReceivedEmail(order);

    return NextResponse.json({ initPoint });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en checkout" },
      { status: 500 }
    );
  }
}
