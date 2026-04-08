import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@pointdosucao:favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((raw) => {
      if (raw) {
        try {
          setFavorites(JSON.parse(raw) as number[]);
        } catch {
          setFavorites([]);
        }
      }
    });
  }, []);

  const persist = useCallback(async (ids: number[]) => {
    setFavorites(ids);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  }, []);

  const toggleFavorite = useCallback(
    async (productId: number) => {
      const updated = favorites.includes(productId)
        ? favorites.filter((id) => id !== productId)
        : [...favorites, productId];
      await persist(updated);
    },
    [favorites, persist]
  );

  const isFavorite = useCallback(
    (productId: number): boolean => favorites.includes(productId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
