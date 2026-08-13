"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
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
  }, [order.id]);

  return null;
}
