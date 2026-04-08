import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

export default function FavoritosScreen() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { getQuantity, updateQuantity } = useCart();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const prods = await getProducts();
      setAllProducts(prods);
    } catch {
      // mantém lista vazia
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const favoriteProducts = allProducts.filter((p) => isFavorite(p.id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (favorites.length === 0 || favoriteProducts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Você ainda não tem favoritos. ❤️{"\n"}
          Adicione produtos no cardápio!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantity={getQuantity(item.id)}
            isFavorite={isFavorite(item.id)}
            onAdd={() => updateQuantity(item, 1)}
            onRemove={() => updateQuantity(item, -1)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  list: {
    paddingVertical: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
});
