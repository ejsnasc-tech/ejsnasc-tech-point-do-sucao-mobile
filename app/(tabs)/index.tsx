import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getProducts, getCategories } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { CartBar } from "@/components/CartBar";
import type { Product, Category } from "@/types/product";
import { BRAND_COLOR, DEFAULT_CATEGORIES, CATEGORY_IMAGES } from "@/constants/categories";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getVisibleCategories(activeCategories: string[]): string[] {
  const withoutAll = activeCategories.filter((category) => category !== "Todos");
  const defaultCategories = DEFAULT_CATEGORIES.filter((category) => category !== "Todos");
  const knownCategories = defaultCategories.filter((category) => withoutAll.includes(category));
  const extraCategories = withoutAll.filter((category) => !defaultCategories.includes(category));

  return [...knownCategories, ...extraCategories];
}

export default function CardapioScreen() {
  const router = useRouter();
  const { updateQuantity, total, qtdTotal } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(CATEGORY_IMAGES);
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
      setCategoryImages((currentImages) => {
        const nextImages = { ...currentImages };

        for (const category of cats) {
          if (category.imagem) {
            nextImages[category.nome] = category.imagem;
          }
        }

        return nextImages;
      });
    } catch {
      setError("Nao foi possivel carregar o cardapio. Tente novamente.");
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

  const allActiveProducts = products.filter(
    (p) =>
      (activeCategories.length === 0 || activeCategories.includes(p.categoria)) &&
      p.ativo !== 0 &&
      p.ativo !== false &&
      p.preco > 0
  );

  const popularProducts = allActiveProducts.filter(
    (p) => p.popular === 1 || p.popular === true
  );

  const categoriesWithProducts = new Set(allActiveProducts.map((p) => p.categoria));
  const visibleCategories = getVisibleCategories(activeCategories).filter(
    (cat) => categoriesWithProducts.has(cat)
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text style={styles.loadingText}>Carregando cardapio...</Text>
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLOR]}
            tintColor={BRAND_COLOR}
          />
        }
      >
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.sectionAccent}>os mais </Text>
              <Text style={styles.sectionNormal}>vendidos</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            >
              {popularProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.popularCard}
                  onPress={() => updateQuantity(product, 1)}
                  activeOpacity={0.85}
                >
                  <View style={styles.popularCircle}>
                    <Image
                      key={product.img || categoryImages[product.categoria] || CATEGORY_IMAGES.Todos}
                      source={{ uri: product.img || categoryImages[product.categoria] || CATEGORY_IMAGES.Todos }}
                      style={styles.popularImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.popularPrice}>{formatBRL(product.preco)}</Text>
                  <Text style={styles.popularName} numberOfLines={2}>
                    {product.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.categoriaTitle}>CATEGORIAS</Text>
          <View style={styles.categoriaGrid}>
            {visibleCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoriaItem}
                onPress={() => router.push(`/categoria/${encodeURIComponent(cat)}`)}
                activeOpacity={0.8}
              >
                <View style={styles.categoriaCircle}>
                  <Image
                    source={{ uri: categoryImages[cat] || CATEGORY_IMAGES.Todos }}
                    style={styles.categoriaImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.categoriaLabel} numberOfLines={2}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

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
  scroll: {
    paddingBottom: 80,
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
    color: BRAND_COLOR,
    fontSize: 15,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 14,
  },
  sectionAccent: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  sectionNormal: {
    color: "#555",
    fontWeight: "400",
  },
  popularList: {
    gap: 16,
    paddingRight: 4,
  },
  popularCard: {
    width: 90,
    alignItems: "center",
  },
  popularCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ececec",
  },
  popularImage: {
    width: "100%",
    height: "100%",
  },
  popularPrice: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLOR,
    textAlign: "center",
  },
  popularName: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
    marginTop: 2,
  },
  categoriaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 16,
  },
  categoriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoriaItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 20,
  },
  categoriaCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ececec",
  },
  categoriaImage: {
    width: "100%",
    height: "100%",
  },
  categoriaLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    maxWidth: 90,
  },
});
