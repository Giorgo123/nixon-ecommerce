"use client";

import { usePathname } from "next/navigation";
import CartSummary from "@/components/cart/CartSummary";

export default function CartDrawer() {
  const pathname = usePathname();
  const isCheckoutPage = pathname === "/checkout";

  return (
    <div className={isCheckoutPage ? "pointer-events-none opacity-100" : ""}>
      <CartSummary showActions={!isCheckoutPage} compact />
    </div>
  );
}
