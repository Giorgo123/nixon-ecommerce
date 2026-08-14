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
  compareAtPrice?: number; // precio "de lista" tachado; undefined = sin descuento
  image: string;
  videoUrl?: string;
  category: "remera" | "oversize" | "buzo" | "taza" | "poster";
  slug: string;
  seo?: string;
  isFeatured: boolean;
  materials?: string;
  careInstructions?: string;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: string[]; // fotos adicionales de galeria, NO incluye la portada (product.image)
}
