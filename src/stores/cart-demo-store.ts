import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = { productId: string; name: string; price: number; quantity: number };

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  subtotal: () => number;
  itemCount: () => number;
};

export const useDemoCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const ex = s.items.find(i => i.productId === item.productId);
          if (ex) return { items: s.items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) };
          return { items: [...s.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.productId !== id) })),
      updateQuantity: (id, qty) =>
        set(s => ({ items: qty > 0 ? s.items.map(i => i.productId === id ? { ...i, quantity: qty } : i) : s.items.filter(i => i.productId !== id) })),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'demo-cart' },
  ),
);
