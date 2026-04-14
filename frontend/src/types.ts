// PRODUCT (Menu Item)
export interface Product {
  _id: string; // backend compatible
  id?: string; // legacy/static data compatibility
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isFeatured?: boolean;
}

export type MenuItem = Product;

// CART ITEM
export interface CartItem extends Product {
  quantity: number;
}

// ORDER ITEM (important for backend)
export interface OrderItem {
  itemId: string | number;
  name: string;
  price: number;
  quantity: number;
}

// ORDER
export interface Order {
  _id: string;
  createdAt: string;

  items: OrderItem[];

  grandTotal: number;

  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";

  tableId?: number;
  totalAmount?: number;
  platformFee?: number;
  serviceTax?: number;
  paymentMethod?: string;
  estimatedTime?: string;
  orderNumber?: number;
  userId?: string;
}

export interface Feedback {
  _id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
