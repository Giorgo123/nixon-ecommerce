import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-[calc(100vh-0px)] bg-white text-black dark:bg-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">
              Admin
            </p>
            <p className="text-sm font-semibold text-black dark:text-white">
              Nixon Studio
            </p>
          </div>
          <AdminNav />
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
