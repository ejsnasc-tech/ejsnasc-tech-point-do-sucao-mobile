import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@/types/product";
import { BRAND_COLOR, CATEGORY_IMAGES } from "@/constants/categories";

type Props = {
  product: Product;
  quantity: number;
  isFavorite: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductCard({
  product,
  quantity,
  isFavorite,
  onAdd,
  onRemove,
  onToggleFavorite,
}: Props) {
  const imageUri = product.img || CATEGORY_IMAGES[product.categoria] || CATEGORY_IMAGES.Todos;

  return (
    <View style={styles.card}>
      {/* Info à esquerda */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.nome}
        </Text>
        {product.descricao ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.descricao}
          </Text>
        ) : null}
        <Text style={styles.price}>{formatBRL(product.preco)}</Text>

        {/* Botões de quantidade */}
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={[styles.qtyButton, quantity === 0 && styles.qtyButtonDisabled]}
            onPress={onRemove}
            disabled={quantity === 0}
          >
            <Ionicons name="remove" size={16} color={quantity === 0 ? "#ccc" : BRAND_COLOR} />
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={onAdd}>
            <Ionicons name="add" size={16} color={BRAND_COLOR} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Imagem + favorito à direita */}
      <View style={styles.imageWrapper}>
        <Image
          key={imageUri}
          source={{ uri: imageUri, cache: "reload" }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? BRAND_COLOR : "#999"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  info: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  description: {
    fontSize: 12,
    color: "#888",
    lineHeight: 17,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLOR,
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonDisabled: {
    borderColor: "#ccc",
  },
  qty: {
    fontSize: 15,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
    color: "#1a1a1a",
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#ececec",
  },
  favoriteButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    padding: 5,
    elevation: 2,
  },
});
