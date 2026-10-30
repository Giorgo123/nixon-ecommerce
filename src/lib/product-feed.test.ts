import { describe, expect, it } from "vitest";
import { buildProductFeed } from "./product-feed";
import type { Product } from "@/features/products/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Remera Oversize Dark Art",
    description: "Remera oversize 100% algodón",
    price: 4500,
    image: "/x.jpg",
    category: "remera",
    slug: "remera-oversize-dark-art",
    isFeatured: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants: [],
    images: [],
    ...overrides,
  };
}

const SITE_URL = "https://nixonstudio.com.ar/";

describe("buildProductFeed", () => {
  it("arma el channel RSS y normaliza la URL del sitio sin barra final", () => {
    const feed = buildProductFeed([], SITE_URL);

    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(feed).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(feed).toContain("<title>Nixon Studio</title>");
    expect(feed).toContain("<link>https://nixonstudio.com.ar</link>");
    expect(feed).toContain("<description>Remeras, buzos, tazas y posters de Nixon Studio.</description>");
  });

  it("emite un item por variante con id, group id, talle, stock y precio de oferta", () => {
    const product = makeProduct({
      id: "prod-1",
      name: "Remera & <Oversize> \"Drop\" '1'",
      description: "<p>Remera   oversize & cómoda</p>",
      price: 40000,
      compareAtPrice: 50000,
      image: "/images/remera.jpg",
      category: "oversize",
      slug: "remera-oversize",
      images: ["/images/extra-1.jpg", "https://cdn.example.com/extra-2.jpg"],
      variants: [
        { id: "v-m", size: "M", color: null, stock: 3 },
        { id: "v-l", size: "L", color: "Negro", stock: 0 },
      ],
    });

    const feed = buildProductFeed([product], SITE_URL);

    expect(feed).toContain(
      "<g:title>Remera &amp; &lt;Oversize&gt; &quot;Drop&quot; &apos;1&apos; - Talle M</g:title>"
    );
    expect(feed).toContain(
      "<g:title>Remera &amp; &lt;Oversize&gt; &quot;Drop&quot; &apos;1&apos; - Talle L - Negro</g:title>"
    );
    expect(feed).toContain("<g:description>Remera oversize &amp; cómoda</g:description>");

    expect(feed).toContain("<g:id>v-m</g:id>");
    expect(feed).toContain("<g:id>v-l</g:id>");
    expect(feed.match(/<g:item_group_id>prod-1<\/g:item_group_id>/g)).toHaveLength(2);

    expect(feed).toContain("<g:size>M</g:size>");
    expect(feed).toContain("<g:size>L</g:size>");
    expect(feed).toContain("<g:color>Negro</g:color>");

    expect(feed).toContain("<g:mpn>v-m</g:mpn>");
    expect(feed).toContain("<g:mpn>v-l</g:mpn>");

    expect(feed).toContain("<g:price>50000.00 ARS</g:price>");
    expect(feed).toContain("<g:sale_price>40000.00 ARS</g:sale_price>");
    expect(feed).toContain("<g:availability>in_stock</g:availability>");
    expect(feed).toContain("<g:availability>backorder</g:availability>");

    expect(feed).toContain(
      "<g:link>https://nixonstudio.com.ar/products/remera-oversize</g:link>"
    );
    expect(feed).toContain(
      "<g:image_link>https://nixonstudio.com.ar/images/remera.jpg</g:image_link>"
    );
    expect(feed).toContain(
      "<g:additional_image_link>https://nixonstudio.com.ar/images/extra-1.jpg</g:additional_image_link>"
    );
    expect(feed).toContain(
      "<g:additional_image_link>https://cdn.example.com/extra-2.jpg</g:additional_image_link>"
    );

    expect(feed).toContain(
      "<g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category>"
    );
    expect(feed).toContain("<g:product_type>Remeras</g:product_type>");
    expect(feed).toContain("<g:gender>unisex</g:gender>");
    expect(feed).toContain("<g:age_group>adult</g:age_group>");
    expect(feed).toContain("<g:size_type>regular</g:size_type>");

    expect(feed).toContain("<g:condition>new</g:condition>");
    expect(feed).toContain("<g:brand>Nixon Studio</g:brand>");
    expect(feed).toContain("<g:identifier_exists>yes</g:identifier_exists>");
    expect(feed).toContain("<g:country>AR</g:country>");
    expect(feed).toContain("<g:service>Envío gratis</g:service>");
    expect(feed).toContain("<g:price>0.00 ARS</g:price>");
  });

  it("publica un único item cuando el producto no tiene variantes", () => {
    const product = makeProduct({
      id: "taza-1",
      name: "Taza Nixon",
      description: "Taza de cerámica",
      price: 12000,
      image: "/images/taza.jpg",
      category: "taza",
      slug: "taza-nixon",
      variants: [],
    });

    const feed = buildProductFeed([product], "https://nixonstudio.com.ar");

    expect(feed.match(/<item>/g)).toHaveLength(1);
    expect(feed).toContain("<g:id>taza-1</g:id>");
    expect(feed).not.toContain("<g:item_group_id>");
    expect(feed).not.toContain("<g:sale_price>");
    expect(feed).toContain("<g:price>12000.00 ARS</g:price>");
    expect(feed).toContain("<g:availability>in_stock</g:availability>");
    expect(feed).toContain("<g:mpn>taza-1</g:mpn>");
    expect(feed).toContain(
      "<g:link>https://nixonstudio.com.ar/products/taza-nixon</g:link>"
    );
    expect(feed).toContain(
      "<g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Tableware &gt; Drinkware &gt; Mugs</g:google_product_category>"
    );
    expect(feed).toContain("<g:product_type>Tazas</g:product_type>");
    expect(feed).not.toContain("<g:gender>");
    expect(feed).not.toContain("<g:size_type>");
  });

  it("usa el id de la variante cuando el producto tiene una única variante sin talle ni color", () => {
    const product = makeProduct({
      id: "poster-1",
      name: "Poster Nixon",
      category: "poster",
      slug: "poster-nixon",
      variants: [{ id: "poster-v1", size: null, color: null, stock: 5 }],
    });

    const feed = buildProductFeed([product], "https://nixonstudio.com.ar");

    expect(feed.match(/<item>/g)).toHaveLength(1);
    expect(feed).toContain("<g:id>poster-v1</g:id>");
    expect(feed).not.toContain("<g:item_group_id>");
    expect(feed).toContain("<g:mpn>poster-v1</g:mpn>");
  });

  it("emite un item por variante aunque sólo cambie el color", () => {
    const product = makeProduct({
      id: "buzo-1",
      name: "Buzo Nixon",
      category: "buzo",
      slug: "buzo-nixon",
      variants: [
        { id: "b-negro", size: null, color: "Negro", stock: 1 },
        { id: "b-blanco", size: null, color: "Blanco", stock: 0 },
      ],
    });

    const feed = buildProductFeed([product], "https://nixonstudio.com.ar");

    expect(feed).toContain("<g:title>Buzo Nixon - Negro</g:title>");
    expect(feed).toContain("<g:title>Buzo Nixon - Blanco</g:title>");
    expect(feed).toContain("<g:item_group_id>buzo-1</g:item_group_id>");
    expect(feed).toContain("<g:color>Negro</g:color>");
    expect(feed).toContain("<g:color>Blanco</g:color>");
    expect(feed).toContain("<g:product_type>Buzos</g:product_type>");
  });

  it("limita las imágenes adicionales a 10 y trunca la descripción a 5000 caracteres", () => {
    const product = makeProduct({
      description: "a".repeat(6000),
      images: Array.from({ length: 12 }, (_, i) => `/images/extra-${i}.jpg`),
    });

    const feed = buildProductFeed([product], "https://nixonstudio.com.ar");

    expect(feed.match(/<g:additional_image_link>/g)).toHaveLength(10);
    expect(feed).toContain(`<g:description>${"a".repeat(5000)}</g:description>`);
  });
});
