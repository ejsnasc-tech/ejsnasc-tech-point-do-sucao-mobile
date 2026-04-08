import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Product } from "@/types/product";

const CART_KEY = "@pointdosucao:cart";

export function useCart() {
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

  const clearCart = useCallback(async () => {
    await persistCart([]);
  }, [persistCart]);

  const total = cart.reduce((sum, item) => sum + item.preco * item.qtde, 0);
  const qtdTotal = cart.reduce((sum, item) => sum + item.qtde, 0);

  return { cart, getQuantity, updateQuantity, clearCart, total, qtdTotal };
}
