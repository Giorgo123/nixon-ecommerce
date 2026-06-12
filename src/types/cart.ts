import type { Product } from "@/types/product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}
