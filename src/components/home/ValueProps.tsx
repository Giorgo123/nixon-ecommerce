import { TRUST_BOX_ITEMS } from "@/lib/constants/commerce-copy";

// Reutiliza las mismas frases que ya están verificadas en PromoBar/TrustBox
// (fuente única: commerce-copy.ts) — esto es otra presentación visual de los
// mismos hechos reales, no texto nuevo inventado para el home.
const items = [
  { icon: CardIcon, text: TRUST_BOX_ITEMS[0] },
  { icon: TruckIcon, text: "Envíos gratis a todo el país" },
  { icon: RefreshIcon, text: "10 días de cambio" },
  { icon: StoreIcon, text: TRUST_BOX_ITEMS[1] },
];

export default function ValueProps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="rounded-2xl border border-black/10 bg-black/2 p-6 dark:border-white/10 dark:bg-white/2"
          >
            <Icon />
            <p className="mt-4 text-sm leading-relaxed text-black/80 dark:text-white/80">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function iconProps() {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    className: "text-red-500",
    "aria-hidden": true as const,
  };
}

function CardIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10h20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 9l1-5h16l1 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9v11h16V9M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
