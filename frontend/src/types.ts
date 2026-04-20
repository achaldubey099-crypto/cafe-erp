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
  isAvailable?: boolean;
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
  completedAt?: string | null;
  sessionId?: string;

  items: OrderItem[];

  grandTotal: number;

  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";

  tableId?: number;
  totalAmount?: number;
  platformFee?: number;
  serviceTax?: number;
  paymentMethod?: string;
  paymentStatus?: "pending" | "partial" | "paid";
  amountPaid?: number;
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

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
