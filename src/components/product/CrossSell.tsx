"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/features/products/types";

interface CrossSellProps {
  products: Product[];
}

export default function CrossSell({ products }: CrossSellProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateArrows() {
      if (!el) return;
      setCanScrollPrev(el.scrollLeft > 0);
      setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [products]);

  if (products.length === 0) return null;

  function scrollByPage(direction: "prev" | "next") {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * (direction === "prev" ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="mt-16 border-t border-black/10 pt-10 dark:border-white/10">
      <h2 className="text-xl font-black tracking-tight text-black dark:text-white sm:text-2xl">
        También te puede gustar
      </h2>
      <div className="relative mt-6">
        {/* Flechas ocultas en mobile: el swipe táctil ya es el patrón esperado
            ahí y las flechas restan espacio útil en pantallas chicas. */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={() => scrollByPage("prev")}
            aria-label="Ver productos anteriores"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 text-black shadow-md transition-opacity duration-300 hover:opacity-80 sm:flex dark:bg-black dark:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        {canScrollNext && (
          <button
            type="button"
            onClick={() => scrollByPage("next")}
            aria-label="Ver más productos"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 text-black shadow-md transition-opacity duration-300 hover:opacity-80 sm:flex dark:bg-black dark:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
        <div
          ref={scrollerRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
