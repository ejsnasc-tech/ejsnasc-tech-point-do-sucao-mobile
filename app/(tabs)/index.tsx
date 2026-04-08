import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { getProducts, getCategories } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/components/ProductCard";
import { CategoryNav } from "@/components/CategoryNav";
import { CartBar } from "@/components/CartBar";
import type { Product, Category } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

export default function CardapioScreen() {
  const router = useRouter();
  const { cart, getQuantity, updateQuantity, total, qtdTotal } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      const activeCatNames = cats
        .filter((c) => c.ativo === 1)
        .map((c) => c.nome);
      setActiveCategories(activeCatNames);
    } catch {
      setError("Não foi possível carregar o cardápio. Tente novamente.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData();
  }, [loadData]);

  const filteredProducts = products.filter((p) => {
    const categoryMatch =
      selectedCategory === "Todos" || p.categoria === selectedCategory;
    const active = activeCategories.length === 0 || activeCategories.includes(p.categoria);
    return categoryMatch && active && p.ativo !== 0 && p.ativo !== false && p.preco > 0;
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
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
        ListHeaderComponent={
          <CategoryNav
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              Nenhum produto encontrado nessa categoria.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLOR]}
            tintColor={BRAND_COLOR}
          />
        }
      />
      <CartBar
        qtdTotal={qtdTotal}
        total={total}
        onPress={() => router.push("/checkout")}
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
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },
  errorText: {
    color: "#e63946",
    fontSize: 15,
    textAlign: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
  },
});
