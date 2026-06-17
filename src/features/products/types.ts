export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "remera" | "oversize" | "buzo" | "taza" | "poster";
  slug: string;
  stock: number;
  seo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithRelations extends Product {
  _count?: {
    orderItems: number;
  };
}
