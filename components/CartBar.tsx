import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND_COLOR } from "@/constants/categories";

type Props = {
  qtdTotal: number;
  total: number;
  onPress: () => void;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CartBar({ qtdTotal, total, onPress }: Props) {
  if (qtdTotal === 0) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{qtdTotal}</Text>
      </View>
      <Text style={styles.label}>Ver carrinho</Text>
      <View style={styles.right}>
        <Text style={styles.total}>{formatBRL(total)}</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLOR,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 12,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  label: {
    flex: 1,
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  total: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
