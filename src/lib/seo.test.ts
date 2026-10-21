import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_URL,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  defaultOpenGraph,
  defaultTwitter,
  getSiteUrl,
} from "./seo";

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
  }
});

describe("getSiteUrl", () => {
  it("cae al dominio de produccion sin NEXT_PUBLIC_SITE_URL", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
  });

  it("usa NEXT_PUBLIC_SITE_URL y quita la barra final", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nixonstudio.com.ar/";
    expect(getSiteUrl()).toBe("https://nixonstudio.com.ar");
  });
});

describe("absoluteUrl", () => {
  it("prefija el dominio a una ruta relativa", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nixonstudio.com.ar";
    expect(absoluteUrl("/products/remera-x")).toBe(
      "https://nixonstudio.com.ar/products/remera-x"
    );
  });

  it("agrega la barra si falta", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nixonstudio.com.ar";
    expect(absoluteUrl("categoria/remeras-oversize")).toBe(
      "https://nixonstudio.com.ar/categoria/remeras-oversize"
    );
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("arma un BreadcrumbList con posiciones 1-based y URLs absolutas", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nixonstudio.com.ar";
    const jsonLd = buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Catálogo", path: "/products" },
      { name: "Remeras Oversize", path: "/categoria/remeras-oversize" },
    ]);

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toHaveLength(3);
    expect(jsonLd.itemListElement[0]).toMatchObject({
      position: 1,
      name: "Inicio",
      item: "https://nixonstudio.com.ar/",
    });
    expect(jsonLd.itemListElement[2]).toMatchObject({
      position: 3,
      name: "Remeras Oversize",
      item: "https://nixonstudio.com.ar/categoria/remeras-oversize",
    });
  });
});

describe("defaults de Open Graph / Twitter", () => {
  it("Open Graph usa tipo website, locale es_AR e imagen por defecto", () => {
    const og = defaultOpenGraph();
    expect(og.type).toBe("website");
    expect(og.locale).toBe("es_AR");
    expect(og.images[0].url).toBe(DEFAULT_OG_IMAGE);
  });

  it("Twitter usa una card large y la imagen por defecto", () => {
    const tw = defaultTwitter();
    expect(tw.card).toBe("summary_large_image");
    expect(tw.images).toEqual([DEFAULT_OG_IMAGE]);
  });
});
