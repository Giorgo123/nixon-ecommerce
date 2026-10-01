"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  hasSearchableQuery,
  type ProductSuggestion,
} from "@/lib/search-suggestions";

const SUGGEST_PATH = "/api/products/suggest";
// Debounce corto: se consulta cuando el usuario deja de teclear, no en cada
// pulsación, para no generar una request por tecla.
const SUGGEST_DEBOUNCE_MS = 140;

interface SearchBoxProps {
  variant: "desktop" | "mobile";
  // Clases del contenedor. desktop = <form className="relative ..."> (solo sm+),
  // mobile = <div className="relative flex items-center sm:hidden">.
  className?: string;
  formClassName?: string;
  inputClassName?: string;  // Ancho/anclaje del panel de sugerencias. desktop: pegado a la derecha del
  // campo (w-80) para crecer hacia la izquierda y no salirse del viewport.
  // mobile: 256px desplazados 64px a la izquierda del campo de 192px, con
  // `max-w` como red de seguridad para viewports muy angostos.
  panelClassName?: string;
  autoFocus?: boolean;
}

export default function SearchBox({
  variant,
  className,
  formClassName,
  inputClassName,
  panelClassName,
  autoFocus,
}: SearchBoxProps) {
  const router = useRouter();
  const listboxId = useId();

  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // `result` y `pending` guardan la consulta a la que pertenecen. En vez de
  // resetear estado cuando el texto cambia (setState en un efecto), se
  // derivan durante el render: si la consulta no coincide, el resultado viejo
  // simplemente no cuenta. Asi no hay un segundo render en cascada por tecla.
  const [result, setResult] = useState<{ query: string; items: ProductSuggestion[]; failed?: boolean } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  // Mobile: el ícono de lupa abre el campo; en desktop el campo siempre está
  // visible y este estado no se usa.
  const [expanded, setExpanded] = useState(variant !== "mobile");

  // desktop cuelga del <form>, mobile del <div> que envuelve campo + ícono.
  // Callback ref (y no useRef<HTMLFormElement>) para poder apuntar al mismo
  // nodo desde las dos ramas del render.
  const containerRef = useRef<HTMLElement | null>(null);
  const setContainer = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  const query = value.trim();
  const searchable = hasSearchableQuery(query);
  // Resultado vigente: null mientras no se consultó esta consulta exacta.
  const current = result && result.query === query ? result : null;
  const suggestions = current?.items ?? [];
  // `searched` distingue "todavía no busqué" de "busqué y no encontré nada".
  // `failed` separa "no hay resultados" de "la consulta no se pudo hacer"
  // (sin red, DB caída o rate limit): no es lo mismo y no se puede mostrar un
  // "sin resultados" falso.
  const searched = current !== null;
  const failed = current?.failed === true;
  const loading = pending === query;
  const open = focused && expanded && searchable && (loading || suggestions.length > 0 || searched);

  // Sugerencias en vivo. Se cancela la request anterior si el usuario sigue
  // escribiendo y se descarta la respuesta de una consulta vieja.
  useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPending(query);
      try {
        const response = await fetch(`${SUGGEST_PATH}?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { suggestions?: ProductSuggestion[] };
        if (controller.signal.aborted) return;
        setResult({ query, items: data.suggestions ?? [] });
      } catch (error) {
        if (controller.signal.aborted) return;
        // Una sugerencia es una ayuda, no un bloqueante: si falla (red, DB,
        // rate limit) el buscador sigue funcionando con Enter, y el panel
        // avisa que no pudo consultar en vez de fingir cero resultados.
        setResult({ query, items: [], failed: true });
        console.warn("Search suggestions unavailable:", error);
      } finally {
        if (!controller.signal.aborted) setPending(null);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchable]);

  // Click fuera y navegación (el Escape se maneja en el input para poder
  // absorber el "clear" nativo de <input type="search">). Solo se cierra con
  // mousedown, nunca con blur: si el panel se desmontara en el blur previo al
  // click, el click sobre una sugerencia se perdería.
  //
  // `popstate` cubre la navegacion con el boton atras/adelante con el panel
  // abierto. Las demas navegaciones ya cierran explicitamente: click en una
  // sugerencia, click en "ver todos los resultados", submit con Enter, o
  // cualquier click fuera del panel.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    }

    function handlePopState() {
      setFocused(false);
      setHighlight(-1);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open]);

  // Tras navegar: se cierra el panel y, en mobile, tambien el campo. Si
  // quedara abierto con el termino viejo, el boton de lupa seguiria oculto y
  // el valor no se veria en ningun lado. En desktop el texto se conserva para
  // poder refinar la busqueda.
  function afterNavigate() {
    setFocused(false);
    setHighlight(-1);
    if (variant === "mobile") {
      setExpanded(false);
      setValue("");
    }
  }

  function goToProduct(slug: string) {
    afterNavigate();
    router.push(`/products/${slug}`);
  }

  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    if (highlight >= 0 && suggestions[highlight]) {
      goToProduct(suggestions[highlight].slug);
      return;
    }
    afterNavigate();
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  }

  // Mobile: si el usuario abre el campo y se va sin escribir nada, se vuelve a
  // mostrar el ícono de lupa (comportamiento previo del navbar). Con texto el
  // campo se queda: cerrarlo en el blur haría perder el click sobre una
  // sugerencia.
  function handleInputBlur(event: { relatedTarget: EventTarget | null }) {
    if (event.relatedTarget && containerRef.current?.contains(event.relatedTarget as Node)) return;
    if (!query) setExpanded(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // preventDefault evita que WebKit limpiar el <input type="search">
      // cuando el panel ya está cerrado y el usuario solo quiere salir.
      if (open || value) event.preventDefault();
      setFocused(false);
      setHighlight(-1);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setHighlight((current) => {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = current + step;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === "Tab") {
      setFocused(false);
      setHighlight(-1);
    }
  }

  const input = (
    <>
      <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `${listboxId}-${highlight}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          // El resaltado pertenece a la consulta anterior: se reinicia acá
          // (no en un efecto) para que Enter nunca salte a otra PDP.
          setHighlight(-1);
        }}
        onFocus={() => setFocused(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder="Buscar"
        aria-label="Buscar productos"
        className={inputClassName}
      />

      {open && (
        // El ancho va en el panel (y no en un wrapper) y con `pt-2` en vez de
        // `mt-2`: el padding es el puente de hover/click del panel y, al
        // tener ancho fijo, el nombre largo del producto no puede estirar el
        // panel mas alla del viewport (que es lo que pasaba con un panel
        // shrink-to-fit). Cada variante ancla distinto: desktop a la derecha
        // del campo (crece hacia la izquierda), mobile desplazado a la
        // izquierda del campo angosto.
        <div className={`absolute top-full z-50 pt-2 ${panelClassName}`}>
          <div className="overflow-hidden rounded-xl border border-nixon-border bg-nixon-surface shadow-lg shadow-black/40">
            {loading && suggestions.length === 0 ? (
              <p className="px-4 py-3 text-xs text-nixon-ink-dim">Buscando…</p>
            ) : null}

            {!loading && suggestions.length > 0 && (
              <>
                <ul id={listboxId} role="listbox" aria-label="Sugerencias de productos" className="max-h-80 overflow-y-auto py-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={suggestion.slug} role="none">
                      <Link
                        id={`${listboxId}-${index}`}
                        role="option"
                        aria-selected={highlight === index}
                        href={`/products/${suggestion.slug}`}
                        onClick={() => {
                          setFocused(false);
                          setHighlight(-1);
                        }}
                        onMouseEnter={() => setHighlight(index)}
                        className={[
                          "flex items-center gap-3 px-3 py-2 transition-colors",
                          highlight === index ? "bg-nixon-bg text-nixon-crimson-bright" : "hover:bg-nixon-bg",
                        ].join(" ")}
                      >
                        <Image
                          src={suggestion.image}
                          alt=""
                          width={40}
                          height={40}
                          sizes="40px"
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-nixon-ink">{suggestion.name}</span>
                          <span className="block text-[11px] text-nixon-ink-dim">{suggestion.categoryLabel}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-nixon-ink-dim">
                          ${suggestion.price.toLocaleString("es-AR")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-nixon-border px-3 py-2">
                  <Link
                    href={`/products?search=${encodeURIComponent(query)}`}
                    onClick={afterNavigate}
                    className="block text-xs font-semibold uppercase tracking-[0.12em] text-nixon-ink-dim transition-colors hover:text-nixon-crimson-bright"
                  >
                    Ver todos los resultados
                  </Link>
                </div>
              </>
            )}

            {!loading && searched && suggestions.length === 0 && (
              <p className="px-4 py-3 text-xs text-nixon-ink-dim">
                {failed ? (
                  <>
                    No pudimos cargar las sugerencias. Presioná <span className="text-nixon-ink">Enter</span> para
                    buscar todos los resultados.
                  </>
                ) : (
                  <>
                    Sin resultados para <span className="text-nixon-ink">“{query}”</span>.
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (variant === "desktop") {
    return (
      <form
        onSubmit={submitSearch}
        ref={setContainer}
        className={className ?? "relative hidden sm:block"}
      >
        {input}
      </form>
    );
  }

  return (
    <div ref={setContainer} className={className ?? "relative flex items-center sm:hidden"}>
      {expanded && (
        <form onSubmit={submitSearch} className={formClassName ?? "absolute right-0 top-1/2 -translate-y-1/2"}>
          {input}
        </form>
      )}
      <button
        type="button"
        onClick={() => {
          setExpanded((open) => !open);
          setHighlight(-1);
        }}
        aria-label="Buscar"
        aria-expanded={expanded}
        className={[
          "flex h-11 w-11 items-center justify-center rounded-full text-nixon-ink-dim transition-colors hover:text-nixon-crimson-bright",
          expanded ? "invisible" : "visible",
        ].join(" ")}
      >
        <SearchGlyph />
      </button>
    </div>
  );
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
