import { TRUST_BOX_ITEMS } from "@/lib/constants/commerce-copy";

export default function TrustBox() {
  return (
    <ul className="grid gap-2 rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
      {TRUST_BOX_ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <CheckIcon />
          {item}
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-red-500" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
