"use client";

import { useState } from "react";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-nixon-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-nixon-ink transition-colors hover:text-nixon-crimson-bright focus-visible:outline-none focus-visible:text-nixon-crimson-bright"
      >
        {title}
        <span
          className={`shrink-0 text-lg transition-all ${open ? "rotate-45 text-nixon-crimson-bright" : "text-nixon-muted"}`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      {open && <div className="pb-4 text-sm leading-6 text-nixon-ink-dim">{children}</div>}
    </div>
  );
}
