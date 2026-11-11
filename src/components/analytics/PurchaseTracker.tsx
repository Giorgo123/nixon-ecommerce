"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { isPaidStatus } from "@/lib/order-status";
import type { Order } from "@/types/order";

interface PurchaseTrackerProps {
  order: Order;
}

// Dispara el evento "purchase" de GA4 al mostrarse la pagina de exito. No es
// 100% equivalente a "pago confirmado" (eso lo sabe recien el webhook de MP),
// pero es el punto estandar donde la mayoria de integraciones simples de GA4
// ecommerce lo disparan.
export default function PurchaseTracker({ order }: PurchaseTrackerProps) {
  useEffect(() => {
    if (!isPaidStatus(order.status)) {
      return;
    }

    // Deduplica por sesión: la página de éxito puede montarse más de una vez
    // (recarga, navegación hacia atrás), pero el purchase debe contarse una
    // sola vez por orden. Si el almacenamiento está bloqueado, se dispara una
    // vez por montaje como degradación aceptada.
    const storageKey = `purchase_tracked:${order.id}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage bloqueado: se sigue adelante con el evento.
    }

    trackEvent("purchase", {
      transaction_id: order.id,
      currency: "ARS",
      value: order.totalPrice,
      coupon: order.couponCode ?? undefined,
      shipping: 0,
      items: order.items.map((item) => ({
        item_id: item.variant.id,
        item_name: item.variant.product.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.status]);

  return null;
}
