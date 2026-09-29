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
  // selections[variacaoId] = Map<opcaoId, quantidade>
  const [selections, setSelections] = useState<Record<number, Map<number, number>>>({});

  useEffect(() => {
    if (!visible || !product) return;
    setSelections({});
    setIsLoading(true);
    getVariacoes(product.id)
      .then((data) => setVariacoes(data))
      .catch(() => setVariacoes([]))
      .finally(() => setIsLoading(false));
  }, [visible, product]);

  const groupTotal = useCallback(
    (variacaoId: number) =>
      Array.from((selections[variacaoId] ?? new Map()).values()).reduce((a, b) => a + b, 0),
    [selections]
  );

  // Single-choice groups (qtd_maxima === 1) keep the old tap-to-select radio behavior.
  const toggleOption = useCallback((variacao: Variacao, opcao: OpcaoVariacao) => {
    setSelections((prev) => {
      const current = new Map(prev[variacao.id] ?? []);
      const already = (current.get(opcao.id) ?? 0) > 0;
      current.clear();
      if (!already) current.set(opcao.id, 1);
      return { ...prev, [variacao.id]: current };
    });
  }, []);

  // Multi-choice groups (qtd_maxima > 1) use a per-option quantity stepper,
  // so the same option (ex: "Pastel de Carne") can be picked more than once.
  const changeQty = useCallback((variacao: Variacao, opcao: OpcaoVariacao, delta: number) => {
    setSelections((prev) => {
      const current = new Map(prev[variacao.id] ?? []);
      const qty = current.get(opcao.id) ?? 0;
      const total = Array.from(current.values()).reduce((a, b) => a + b, 0);

      if (delta > 0 && total >= variacao.qtd_maxima) return prev; // max reached
      const next = Math.max(0, qty + delta);
      if (next === 0) current.delete(opcao.id);
      else current.set(opcao.id, next);

      return { ...prev, [variacao.id]: current };
    });
  }, []);

  const isValid = variacoes.every((v) => groupTotal(v.id) >= v.qtd_minima);

  const computedPrice = (() => {
    if (!product) return 0;
    let total = product.preco;
    for (const variacao of variacoes) {
      const qtyById = selections[variacao.id] ?? new Map<number, number>();
      for (const opcao of variacao.opcoes) {
        total += opcao.preco * (qtyById.get(opcao.id) ?? 0);
      }
    }
    return total;
  })();

  const handleAdd = useCallback(() => {
    if (!product || !isValid) return;
    const allSelected: OpcaoVariacao[] = [];
    for (const variacao of variacoes) {
      const qtyById = selections[variacao.id] ?? new Map<number, number>();
      for (const opcao of variacao.opcoes) {
        const qty = qtyById.get(opcao.id) ?? 0;
        for (let i = 0; i < qty; i++) allSelected.push(opcao);
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
            {variacoes.map((variacao) => {
              const isMulti = variacao.qtd_maxima > 1;
              const total = groupTotal(variacao.id);
              return (
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
                  {isMulti && (
                    <Text style={styles.groupSub}>{total}/{variacao.qtd_maxima} escolhidos</Text>
                  )}

                  {variacao.opcoes
                    .filter((o) => o.ativo === 1)
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((opcao) => {
                      const qty = selections[variacao.id]?.get(opcao.id) ?? 0;
                      const selected = qty > 0;

                      if (isMulti) {
                        return (
                          <View
                            key={opcao.id}
                            style={[styles.option, selected && styles.optionSelected]}
                          >
                            <View style={styles.optionLeft}>
                              <Text style={[styles.optionName, selected && styles.optionNameSelected]}>
                                {opcao.nome}
                              </Text>
                              {opcao.preco > 0 && (
                                <Text style={styles.optionPrice}>+ {formatBRL(opcao.preco)}</Text>
                              )}
                            </View>
                            <View style={styles.stepper}>
                              <TouchableOpacity
                                onPress={() => changeQty(variacao, opcao, -1)}
                                disabled={qty === 0}
                                style={[styles.stepperBtn, qty === 0 && styles.stepperBtnDisabled]}
                                hitSlop={8}
                              >
                                <Text style={styles.stepperBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                onPress={() => changeQty(variacao, opcao, 1)}
                                disabled={total >= variacao.qtd_maxima}
                                style={[styles.stepperBtn, styles.stepperBtnAdd, total >= variacao.qtd_maxima && styles.stepperBtnDisabled]}
                                hitSlop={8}
                              >
                                <Text style={[styles.stepperBtnText, styles.stepperBtnAddText]}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      }

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
                          <View style={[styles.radio, selected && styles.controlSelected]}>
                            {selected && <View style={styles.radioDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              );
            })}
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
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnAdd: {
    backgroundColor: BRAND_COLOR,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555",
  },
  stepperBtnAddText: {
    color: "#fff",
  },
  stepperQty: {
    width: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
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
