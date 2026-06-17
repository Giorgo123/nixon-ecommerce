import type { Product } from "@/types/product";

export interface OrderItem {
  product: Product;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
