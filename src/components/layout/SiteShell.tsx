"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { trackPageview } from "@/lib/analytics";

export default function SiteShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminArea) {
      trackPageview(pathname);
    }
  }, [pathname, isAdminArea]);

  return (
    <>
      {!isAdminArea && <Navbar />}
      <div className="flex flex-1 flex-col">{children}</div>
      {!isAdminArea && <Footer />}
      {!isAdminArea && <CartDrawer />}
    </>
  );
}
