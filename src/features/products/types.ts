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
  // "oversize" es legado: categoria vieja duplicada de "remera" (misma
  // prenda), ya no se ofrece para productos nuevos. Se mantiene en el tipo
  // porque hay filas reales en la DB que todavia la tienen guardada - ver
  // normalizeCategory() en @/lib/categories.
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
