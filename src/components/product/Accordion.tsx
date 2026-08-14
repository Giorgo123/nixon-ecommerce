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
    <div className="border-b border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-black dark:text-white"
      >
        {title}
        <span className={`shrink-0 transition-transform ${open ? "rotate-45" : ""}`} aria-hidden="true">
          +
        </span>
      </button>
      {open && <div className="pb-4 text-sm leading-6 text-black/70 dark:text-white/70">{children}</div>}
    </div>
  );
}
