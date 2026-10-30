"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface ViewContentTrackerProps {
  productId: string;
  productName: string;
  price: number;
  variantId?: string;
}

export default function ViewContentTracker({
  productId,
  productName,
  price,
  variantId,
}: ViewContentTrackerProps) {
  useEffect(() => {
    trackEvent("view_item", {
      currency: "ARS",
      value: price,
      items: [
        {
          item_id: variantId ?? productId,
          item_name: productName,
          price,
          quantity: 1,
        },
      ],
    });
  }, [productId, productName, price, variantId]);

  return null;
}
