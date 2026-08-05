export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  category: string;
  size: string | null;
  color: string | null;
  stock: number;
  quantity: number;
}
