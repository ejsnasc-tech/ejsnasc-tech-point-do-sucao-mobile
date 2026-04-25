import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBairros } from "@/lib/api";
import type { Bairro } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

type Props = {
  value: string;
  onSelect: (bairro: Bairro) => void;
  hasError?: boolean;
  placeholder?: string;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BairroPicker({
  value,
  onSelect,
  hasError = false,
  placeholder = "Selecione seu bairro",
}: Props) {
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    getBairros()
      .then((data) => {
        if (!mounted) return;
        const ativos = data.filter((b) => b.ativo === 1);
        ativos.sort((a, b) => a.nome.localeCompare(b.nome));
        setBairros(ativos);
      })
      .catch((err) => console.warn("[BairroPicker] erro ao carregar bairros:", err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = bairros.filter((b) =>
    b.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Selecione o bairro</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Buscar bairro..."
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={BRAND_COLOR} />
                <Text style={styles.loadingText}>Carregando bairros...</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const selected = value.toLowerCase() === item.nome.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[styles.item, selected && styles.itemSelected]}
                      onPress={() => {
                        onSelect(item);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          selected && styles.itemTextSelected,
                        ]}
                      >
                        {item.nome}
                      </Text>
                      <Text
                        style={[
                          styles.itemTaxa,
                          selected && styles.itemTextSelected,
                        ]}
                      >
                        {item.taxa_entrega > 0
                          ? formatBRL(item.taxa_entrega)
                          : "Grátis"}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    Nenhum bairro encontrado. Não atendemos sua região ainda.
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  fieldError: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff5f5",
  },
  fieldText: {
    fontSize: 15,
    color: "#222",
    flex: 1,
  },
  placeholder: {
    color: "#999",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  search: {
    backgroundColor: "#f5f5f5",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  loading: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemSelected: {
    backgroundColor: "#fff5f0",
  },
  itemText: {
    fontSize: 15,
    color: "#222",
    flex: 1,
  },
  itemTaxa: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  itemTextSelected: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    padding: 30,
    color: "#666",
  },
});
