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
import { BRAND_COLOR } from "@/constants/categories";

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
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: product.img }}
        style={styles.image}
        resizeMode="cover"
      />
      <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={isFavorite ? BRAND_COLOR : "#999"}
        />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.nome}
        </Text>
        {product.descricao ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.descricao}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatBRL(product.preco)}</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.qtyButton, quantity === 0 && styles.qtyButtonDisabled]}
              onPress={onRemove}
              disabled={quantity === 0}
            >
              <Ionicons name="remove" size={18} color={quantity === 0 ? "#ccc" : BRAND_COLOR} />
            </TouchableOpacity>
            <Text style={styles.qty}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={onAdd}>
              <Ionicons name="add" size={18} color={BRAND_COLOR} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: 160,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 6,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonDisabled: {
    borderColor: "#ccc",
  },
  qty: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
    color: "#1a1a1a",
  },
});
