import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getVariacoes } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import type { Product, Variacao, OpcaoVariacao } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
};

export function VariacaoModal({ product, visible, onClose }: Props) {
  const { addVariacaoItem } = useCart();
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selections, setSelections] = useState<Record<number, Set<number>>>({});

  useEffect(() => {
    if (!visible || !product) return;
    setSelections({});
    setIsLoading(true);
    getVariacoes(product.id)
      .then((data) => setVariacoes(data))
      .catch(() => setVariacoes([]))
      .finally(() => setIsLoading(false));
  }, [visible, product]);

  const toggleOption = useCallback((variacao: Variacao, opcao: OpcaoVariacao) => {
    setSelections((prev) => {
      const current = new Set(prev[variacao.id] ?? []);
      if (current.has(opcao.id)) {
        current.delete(opcao.id);
      } else {
        if (variacao.qtd_maxima === 1) {
          current.clear();
        }
        if (current.size < variacao.qtd_maxima) {
          current.add(opcao.id);
        }
      }
      return { ...prev, [variacao.id]: current };
    });
  }, []);

  const isValid = variacoes.every((v) => (selections[v.id]?.size ?? 0) >= v.qtd_minima);

  const computedPrice = (() => {
    if (!product) return 0;
    let total = product.preco;
    for (const variacao of variacoes) {
      const selectedIds = selections[variacao.id] ?? new Set<number>();
      for (const opcao of variacao.opcoes) {
        if (selectedIds.has(opcao.id)) total += opcao.preco;
      }
    }
    return total;
  })();

  const handleAdd = useCallback(() => {
    if (!product || !isValid) return;
    const allSelected: OpcaoVariacao[] = [];
    for (const variacao of variacoes) {
      const selectedIds = selections[variacao.id] ?? new Set<number>();
      for (const opcao of variacao.opcoes) {
        if (selectedIds.has(opcao.id)) allSelected.push(opcao);
      }
    }
    const cartKey = `${product.id}_${allSelected.map((o) => o.id).sort().join("_")}`;
    const variacaoLabel = allSelected.map((o) => o.nome).join(", ");
    addVariacaoItem(product, cartKey, computedPrice, variacaoLabel);
    onClose();
  }, [product, variacoes, selections, isValid, computedPrice, addVariacaoItem, onClose]);

  if (!product) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {product.nome}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={BRAND_COLOR} style={styles.loader} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {variacoes.map((variacao) => (
              <View key={variacao.id} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{variacao.nome}</Text>
                  <Text style={[
                    styles.groupBadge,
                    variacao.qtd_minima > 0 ? styles.badgeRequired : styles.badgeOptional,
                  ]}>
                    {variacao.qtd_minima > 0 ? "Obrigatório" : "Opcional"}
                  </Text>
                </View>
                {variacao.qtd_maxima > 1 && (
                  <Text style={styles.groupSub}>Escolha até {variacao.qtd_maxima}</Text>
                )}

                {variacao.opcoes
                  .filter((o) => o.ativo === 1)
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((opcao) => {
                    const selected = selections[variacao.id]?.has(opcao.id) ?? false;
                    const isRadio = variacao.qtd_maxima === 1;
                    return (
                      <TouchableOpacity
                        key={opcao.id}
                        style={[styles.option, selected && styles.optionSelected]}
                        onPress={() => toggleOption(variacao, opcao)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <Text style={[styles.optionName, selected && styles.optionNameSelected]}>
                            {opcao.nome}
                          </Text>
                          {opcao.preco > 0 && (
                            <Text style={styles.optionPrice}>+ {formatBRL(opcao.preco)}</Text>
                          )}
                        </View>
                        <View style={[
                          isRadio ? styles.radio : styles.checkbox,
                          selected && styles.controlSelected,
                        ]}>
                          {selected && isRadio && (
                            <View style={styles.radioDot} />
                          )}
                          {selected && !isRadio && (
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addBtn, !isValid && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>
              Adicionar · {formatBRL(computedPrice)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
  loader: {
    marginVertical: 40,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  groupBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  badgeRequired: {
    backgroundColor: "#fde8ea",
    color: BRAND_COLOR,
  },
  badgeOptional: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
  groupSub: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff5f5",
  },
  optionLeft: {
    flex: 1,
    marginRight: 12,
  },
  optionName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  optionNameSelected: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },
  optionPrice: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  controlSelected: {
    borderColor: BRAND_COLOR,
    backgroundColor: BRAND_COLOR,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  addBtn: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  addBtnDisabled: {
    backgroundColor: "#ccc",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
