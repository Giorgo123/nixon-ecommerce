import type { Product, ProductVariant } from "@/features/products/types";
import { normalizeCategory } from "@/lib/categories";

const CHANNEL_TITLE = "Nixon Studio";
const CHANNEL_DESCRIPTION = "Remeras, buzos, tazas y posters de Nixon Studio.";
const BRAND = "Nixon Studio";
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ADDITIONAL_IMAGES = 10;

type Availability = "in_stock" | "backorder";

type CategoryMetadata = {
  googleProductCategory: string;
  productType: string;
  apparel: boolean;
};

type FeedItem = {
  id: string;
  itemGroupId?: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  price: number;
  salePrice?: number;
  availability: Availability;
  mpn: string;
  size?: string;
  color?: string;
  category: CategoryMetadata | null;
};

// Google exige que g:price sea el precio de lista y g:sale_price el precio
// rebajado (menor). En la tienda `price` es el precio que se cobra y
// `compareAtPrice` el "precio anterior" tachado, así que se invierten al
// mapearlos al feed.
function getPricing(product: Product): { price: number; salePrice?: number } {
  const isOnSale =
    typeof product.compareAtPrice === "number" && product.compareAtPrice > product.price;

  return {
    price: isOnSale ? product.compareAtPrice! : product.price,
    salePrice: isOnSale ? product.price : undefined,
  };
}

function getCategoryMetadata(category: string): CategoryMetadata | null {
  switch (normalizeCategory(category)) {
    case "remera":
      return {
        googleProductCategory: "Apparel & Accessories > Clothing > Shirts & Tops",
        productType: "Remeras",
        apparel: true,
      };
    case "buzo":
      return {
        googleProductCategory: "Apparel & Accessories > Clothing > Shirts & Tops",
        productType: "Buzos",
        apparel: true,
      };
    case "taza":
      return {
        googleProductCategory:
          "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
        productType: "Tazas",
        apparel: false,
      };
    case "poster":
      return {
        googleProductCategory: "Home & Garden > Decor > Posters",
        productType: "Posters",
        apparel: false,
      };
    default:
      return null;
  }
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function absoluteUrl(value: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plainDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

function variantAvailability(variant: ProductVariant): Availability {
  return variant.stock > 0 ? "in_stock" : "backorder";
}

// La tienda vende "a pedido": sin stock real se ofrece como backorder, nunca
// como out_of_stock. Un producto sin variantes no tiene stock que consultar,
// así que se considera comprable.
function productAvailability(variants: ProductVariant[]): Availability {
  if (variants.length === 0) return "in_stock";
  return variants.some((variant) => variant.stock > 0) ? "in_stock" : "backorder";
}

function variantTitle(productName: string, variant: ProductVariant): string {
  let title = productName;
  if (variant.size) title += ` - Talle ${variant.size}`;
  if (variant.color) title += ` - ${variant.color}`;
  return title;
}

function buildItems(product: Product, siteUrl: string): FeedItem[] {
  const common = {
    description: plainDescription(product.seo ?? product.description),
    link: `${siteUrl}/products/${product.slug}`,
    imageLink: absoluteUrl(product.image, siteUrl),
    additionalImageLinks: product.images
      .slice(0, MAX_ADDITIONAL_IMAGES)
      .map((image) => absoluteUrl(image, siteUrl)),
    ...getPricing(product),
    category: getCategoryMetadata(product.category),
  };

  // Con más de una variante (o variantes con talle/color) cada variante es un
  // item propio de Google, agrupado por item_group_id. Un producto sin esas
  // variantes se publica como un único item.
  const hasVariantItems =
    product.variants.length > 1 ||
    product.variants.some((variant) => Boolean(variant.size || variant.color));

  if (!hasVariantItems) {
    // El feed debe compartir el mismo id que el Pixel/CAPI (`variant.id`).
    const id = product.variants[0]?.id ?? product.id;
    return [
      {
        ...common,
        id,
        title: product.name,
        availability: productAvailability(product.variants),
        mpn: id,
      },
    ];
  }

  return product.variants.map((variant) => ({
    ...common,
    id: variant.id,
    itemGroupId: product.id,
    title: variantTitle(product.name, variant),
    availability: variantAvailability(variant),
    mpn: variant.id,
    size: variant.size ?? undefined,
    color: variant.color ?? undefined,
  }));
}

function categoryLines(category: CategoryMetadata): string[] {
  const lines = [
    `      <g:google_product_category>${escapeXml(category.googleProductCategory)}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(category.productType)}</g:product_type>`,
  ];

  if (category.apparel) {
    lines.push(
      "      <g:gender>unisex</g:gender>",
      "      <g:age_group>adult</g:age_group>",
      "      <g:size_type>regular</g:size_type>"
    );
  }

  return lines;
}

function renderItem(item: FeedItem): string {
  const lines = [
    "    <item>",
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    item.itemGroupId
      ? `      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>`
      : null,
    `      <g:title>${escapeXml(item.title)}</g:title>`,
    `      <g:description>${escapeXml(item.description)}</g:description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
    ...item.additionalImageLinks.map(
      (url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`
    ),
    `      <g:price>${item.price.toFixed(2)} ARS</g:price>`,
    item.salePrice !== undefined
      ? `      <g:sale_price>${item.salePrice.toFixed(2)} ARS</g:sale_price>`
      : null,
    `      <g:availability>${item.availability}</g:availability>`,
    "      <g:condition>new</g:condition>",
    `      <g:brand>${escapeXml(BRAND)}</g:brand>`,
    `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>`,
    "      <g:identifier_exists>yes</g:identifier_exists>",
    item.size ? `      <g:size>${escapeXml(item.size)}</g:size>` : null,
    item.color ? `      <g:color>${escapeXml(item.color)}</g:color>` : null,
    ...(item.category ? categoryLines(item.category) : []),
    "      <g:shipping>",
    "        <g:country>AR</g:country>",
    "        <g:service>Envío gratis</g:service>",
    "        <g:price>0.00 ARS</g:price>",
    "      </g:shipping>",
    "    </item>",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

export function buildProductFeed(products: Product[], siteUrl: string): string {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const items = products.flatMap((product) => buildItems(product, normalizedSiteUrl));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escapeXml(CHANNEL_TITLE)}</title>`,
    `    <link>${escapeXml(normalizedSiteUrl)}</link>`,
    `    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>`,
    ...items.map(renderItem),
    "  </channel>",
    "</rss>",
  ].join("\n");
}
