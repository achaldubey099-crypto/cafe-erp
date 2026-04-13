import { Product, Order } from './types';

export const PRODUCTS: Product[] = [
  {
    _id: '1',
    name: 'Velvet Latte',
    description: 'Smooth espresso with silky steamed milk and a touch of vanilla.',
    price: 4.50,
    image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee'
  },
  {
    _id: '2',
    name: 'Single Origin Espresso',
    description: 'Rich, full-bodied espresso with notes of dark chocolate and berry.',
    price: 3.20,
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee'
  },
  {
    _id: '3',
    name: 'Oat Milk Shakerato',
    description: 'Espresso shaken with ice and creamy oat milk.',
    price: 5.10,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee'
  },
  {
    _id: '4',
    name: 'Flat White',
    description: 'Micro-foam poured over a double shot of espresso.',
    price: 4.20,
    image: 'https://images.unsplash.com/photo-1577968897866-be502595846a?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee'
  },
  {
    _id: '5',
    name: 'Vanilla Bourbon Cold Brew',
    description: 'Slow-steeped for 18 hours with Madagascan vanilla.',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee',
    isFeatured: true
  },
  {
    _id: '6',
    name: 'Butter Croissant',
    description: 'Flaky, buttery, and baked fresh daily.',
    price: 4.25,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    category: 'Snacks'
  },
  {
    _id: '7',
    name: 'Avocado Tartine',
    description: 'Sourdough bread topped with smashed avocado and chili flakes.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    category: 'Snacks'
  }
];

export const PAST_ORDERS: Order[] = [
  {
    _id: 'AC-4921',
    createdAt: 'Oct 24, 10:42 AM',
    items: [
      { itemId: 1, name: 'Double Espresso', price: 3.75, quantity: 1 },
      { itemId: 2, name: 'Croissant', price: 4.5, quantity: 1 }
    ],
    grandTotal: 8.25,
    status: 'completed',
    tableId: 1
  },
  {
    _id: 'AC-4810',
    createdAt: 'Oct 20, 09:15 AM',
    items: [
      { itemId: 1, name: 'Oat Latte', price: 5.5, quantity: 1 }
    ],
    grandTotal: 5.5,
    status: 'completed',
    tableId: 1
  }
];
