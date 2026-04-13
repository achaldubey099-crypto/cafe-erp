// PRODUCT (Menu Item)
export interface Product {
  _id: string; // backend compatible
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isFeatured?: boolean;
}

// CART ITEM
export interface CartItem extends Product {
  quantity: number;
}

// ORDER ITEM (important for backend)
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// ORDER
export interface Order {
  _id: string;
  createdAt: string;

  items: OrderItem[];

  total: number;

  status: "pending" | "preparing" | "ready" | "completed";

  // optional (future use)
  userId?: string;
}