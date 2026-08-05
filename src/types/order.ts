export interface OrderItemVariant {
  id: string;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    name: string;
    image: string;
    category: string;
  };
}

export interface OrderItem {
  quantity: number;
  price: number;
  variant: OrderItemVariant;
}

export interface Order {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  deliveryMethod: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  trackingInfo: string | null;
  paymentMethod: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
