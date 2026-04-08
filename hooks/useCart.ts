import React, { useState, useEffect, useCallback, useContext, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Product } from "@/types/product";

const CART_KEY = "@pointdosucao:cart";

type CartContextType = {
  cart: CartItem[];
  getQuantity: (productId: number) => number;
  updateQuantity: (product: Product, delta: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  qtdTotal: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        try {
          setCart(JSON.parse(raw) as CartItem[]);
        } catch {
          setCart([]);
        }
      }
    });
  }, []);

  const persistCart = useCallback(async (newCart: CartItem[]) => {
    setCart(newCart);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
  }, []);

  const getQuantity = useCallback(
    (productId: number): number => {
      return cart.find((item) => item.id === productId)?.qtde ?? 0;
    },
    [cart]
  );

  const updateQuantity = useCallback(
    async (product: Product, delta: number) => {
      const current = cart.find((item) => item.id === product.id);
      let newCart: CartItem[];

      if (!current) {
        if (delta <= 0) return;
        newCart = [...cart, { ...product, qtde: delta }];
      } else {
        const newQtde = current.qtde + delta;
        if (newQtde <= 0) {
          newCart = cart.filter((item) => item.id !== product.id);
        } else {
          newCart = cart.map((item) =>
            item.id === product.id ? { ...item, qtde: newQtde } : item
          );
        }
      }

      await persistCart(newCart);
    },
    [cart, persistCart]
  );

  const removeItem = useCallback(
    async (productId: number) => {
      const newCart = cart.filter((item) => item.id !== productId);
      await persistCart(newCart);
    },
    [cart, persistCart]
  );

  const clearCart = useCallback(async () => {
    await persistCart([]);
  }, [persistCart]);

  const total = cart.reduce((sum, item) => sum + item.preco * item.qtde, 0);
  const qtdTotal = cart.reduce((sum, item) => sum + item.qtde, 0);

  return React.createElement(
    CartContext.Provider,
    { value: { cart, getQuantity, updateQuantity, removeItem, clearCart, total, qtdTotal } },
    children
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
