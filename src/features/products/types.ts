export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "remera" | "oversize" | "buzo" | "taza" | "poster";
  slug: string;
  seo?: string;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}
