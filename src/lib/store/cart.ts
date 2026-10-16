import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

type CartState = {
  items: CartItem[];
  tableNumber: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  setTableNumber: (tableNumber: string | null) => void;
  clearCart: () => void;
  getCartTotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableNumber: null,
      addItem: (item) => {
        set((state) => {
          // check if exact item with same notes exists
          const existingIndex = state.items.findIndex(
            (i) => i.menuItemId === item.menuItemId && i.notes === item.notes
          );
          
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            return { items: newItems };
          }
          
          return {
            items: [...state.items, { ...item, id: crypto.randomUUID() }]
          };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => i.id === id ? { ...i, quantity } : i)
      })),
      updateNotes: (id, notes) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, notes } : i)
      })),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      }
    }),
    {
      name: 'cafe-cart-storage',
    }
  )
);
