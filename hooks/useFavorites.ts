import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@pointdosucao:favorites";

type FavoritesContextType = {
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (productId: number): boolean => favorites.includes(productId),
    [favorites]
  );

  return React.createElement(
    FavoritesContext.Provider,
    { value: { favorites, toggleFavorite, isFavorite } },
    children
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
