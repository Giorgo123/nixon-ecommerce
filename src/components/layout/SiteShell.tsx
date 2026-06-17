"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function SiteShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminArea && <Navbar />}
      <div className="flex flex-1 flex-col">{children}</div>
      {!isAdminArea && <Footer />}
    </>
  );
}
