import AdminLoginForm from "@/components/auth/AdminLoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-red-500">
            Admin
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
            Ingresar al panel
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            En desarrollo: `admin@nixonstudio.com` / `admin123`
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
