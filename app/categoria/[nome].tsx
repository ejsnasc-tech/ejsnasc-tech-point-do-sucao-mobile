import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { getProducts, getCategories } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/components/ProductCard";
import { CartBar } from "@/components/CartBar";
import { useRouter } from "expo-router";
import type { Product } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

export default function CategoriaScreen() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const router = useRouter();
  const { getQuantity, updateQuantity, total, qtdTotal } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      const activeCatNames = cats.filter((c) => c.ativo === 1).map((c) => c.nome);
      setActiveCategories(activeCatNames);
    } catch {
      setError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();

      const intervalId = setInterval(() => {
        void loadData();
      }, 15000);

      return () => clearInterval(intervalId);
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData();
  }, [loadData]);

  const filteredProducts = products.filter(
    (p) =>
      (nome === "Todos" || p.categoria === nome) &&
      (activeCategories.length === 0 || activeCategories.includes(p.categoria)) &&
      p.ativo !== 0 &&
      p.ativo !== false &&
      p.preco > 0
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
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
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
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
    backgroundColor: "#f5f5f5",
  },
  list: {
    paddingTop: 12,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },
  errorText: {
    color: BRAND_COLOR,
    fontSize: 15,
    textAlign: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
  },
});
