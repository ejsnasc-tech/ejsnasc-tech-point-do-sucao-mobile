import React, { useState, useEffect, useCallback, useContext, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Product } from "@/types/product";

const CART_KEY = "@pointdosucao:cart";

type CartContextType = {
  cart: CartItem[];
  getQuantity: (productId: number) => number;
  updateQuantity: (product: Product, delta: number) => Promise<void>;
  adjustQuantity: (cartKey: string, delta: number) => Promise<void>;
  addVariacaoItem: (product: Product, cartKey: string, preco: number, variacaoLabel: string) => Promise<void>;
  removeItem: (cartKey: string) => Promise<void>;
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
      return cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + item.qtde, 0);
    },
    [cart]
  );

  const updateQuantity = useCallback(
    async (product: Product, delta: number) => {
      const cartKey = String(product.id);
      const current = cart.find((item) => item.cartKey === cartKey);
      let newCart: CartItem[];

      if (!current) {
        if (delta <= 0) return;
        newCart = [...cart, { ...product, qtde: delta, cartKey }];
      } else {
        const newQtde = current.qtde + delta;
        if (newQtde <= 0) {
          newCart = cart.filter((item) => item.cartKey !== cartKey);
        } else {
          newCart = cart.map((item) =>
            item.cartKey === cartKey ? { ...item, qtde: newQtde } : item
          );
        }
      }

      await persistCart(newCart);
    },
    [cart, persistCart]
  );

  const addVariacaoItem = useCallback(
    async (product: Product, cartKey: string, preco: number, variacaoLabel: string) => {
      const current = cart.find((item) => item.cartKey === cartKey);
      let newCart: CartItem[];
      if (!current) {
        newCart = [...cart, { ...product, preco, qtde: 1, cartKey, variacao_label: variacaoLabel }];
      } else {
        newCart = cart.map((item) =>
          item.cartKey === cartKey ? { ...item, qtde: item.qtde + 1 } : item
        );
      }
      await persistCart(newCart);
    },
    [cart, persistCart]
  );

  const adjustQuantity = useCallback(
    async (cartKey: string, delta: number) => {
      const current = cart.find((item) => item.cartKey === cartKey);
      if (!current) return;
      const newQtde = current.qtde + delta;
      let newCart: CartItem[];
      if (newQtde <= 0) {
        newCart = cart.filter((item) => item.cartKey !== cartKey);
      } else {
        newCart = cart.map((item) =>
          item.cartKey === cartKey ? { ...item, qtde: newQtde } : item
        );
      }
      await persistCart(newCart);
    },
    [cart, persistCart]
  );

  const removeItem = useCallback(
    async (cartKey: string) => {
      const newCart = cart.filter((item) => item.cartKey !== cartKey);
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
    { value: { cart, getQuantity, updateQuantity, adjustQuantity, addVariacaoItem, removeItem, clearCart, total, qtdTotal } },
    children
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
