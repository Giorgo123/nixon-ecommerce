"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/CartDrawer";
import WhatsappButton from "@/components/layout/WhatsappButton";
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

  if (isAdminArea) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="dark flex flex-1 flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <CartDrawer />
      <WhatsappButton />
    </div>
  );
}
