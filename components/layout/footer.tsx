export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 py-10 text-sm text-black/70 dark:border-white/10 dark:text-white/70">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="tracking-wide">© {new Date().getFullYear()} Nixon Studio</p>
          <p className="tracking-wide">
            Instagram: <span className="text-black dark:text-white">@nixonstudio</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
