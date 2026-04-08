import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { createPedido } from "@/lib/api";
import { BRAND_COLOR } from "@/constants/categories";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, total, clearCart, removeItem } = useCart();
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState(user?.nome ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [rua, setRua] = useState(user?.rua ?? "");
  const [numero, setNumero] = useState(user?.numero ?? "");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState(user?.bairro ?? "");
  const [referencia, setReferencia] = useState(user?.referencia ?? "");
  const [isRetirada, setIsRetirada] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [observacao, setObservacao] = useState("");
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preenche campos automaticamente quando user carrega do AsyncStorage
  useEffect(() => {
    if (user) {
      setNome((prev) => prev || user.nome || "");
      setTelefone((prev) => prev || user.telefone || "");
      setRua((prev) => prev || user.rua || "");
      setNumero((prev) => prev || user.numero || "");
      setBairro((prev) => prev || user.bairro || "");
      setReferencia((prev) => prev || user.referencia || "");
    }
  }, [user]);

  const formasPagamento = [
    { value: "pix", label: "PIX" },
    { value: "dinheiro", label: "Dinheiro" },
    { value: "cartao_credito", label: "Cartão Crédito" },
    { value: "cartao_debito", label: "Cartão Débito" },
  ];

  const handleSubmit = useCallback(async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Por favor, informe seu nome.");
      return;
    }
    if (!telefone.trim()) {
      Alert.alert("Atenção", "Por favor, informe seu telefone.");
      return;
    }
    if (!isRetirada && !rua.trim()) {
      Alert.alert("Atenção", "Por favor, informe a rua para entrega.");
      return;
    }
    if (!isRetirada && !bairro.trim()) {
      Alert.alert("Atenção", "Por favor, informe o bairro para entrega.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Atenção", "Seu carrinho está vazio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const enderecoEntrega = isRetirada
        ? "Retirada no local"
        : [rua.trim(), numero.trim(), bairro.trim()].filter(Boolean).join(", ");

      const payload = {
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        endereco_entrega: enderecoEntrega,
        rua: isRetirada ? "Retirada" : rua.trim(),
        numero: isRetirada ? "0" : numero.trim() || "S/N",
        complemento: complemento.trim() || undefined,
        bairro: isRetirada ? "Centro" : bairro.trim(),
        cidade: "Estância",
        referencia: referencia.trim() || undefined,
        forma_pagamento: formaPagamento,
        observacao: isRetirada
          ? [observacao.trim(), "RETIRADA NO LOCAL"].filter(Boolean).join(" - ")
          : observacao.trim() || undefined,
        troco_para:
          formaPagamento === "dinheiro" && precisaTroco && trocoPara
            ? parseFloat(trocoPara)
            : undefined,
        subtotal: total,
        taxa_entrega: 0,
        total,
        itens: cart.map((item) => ({
          produto_id: item.id,
          nome_produto: item.nome,
          preco_unitario: item.preco,
          quantidade: item.qtde,
        })),
      };

      await createPedido(payload);
      console.log("[Checkout] Pedido criado com sucesso!");

      // Salva dados do cliente para preencher automaticamente no próximo pedido
      await updateUser({
        nome: nome.trim(),
        telefone: telefone.trim(),
        rua: isRetirada ? user?.rua : rua.trim(),
        numero: isRetirada ? user?.numero : numero.trim(),
        bairro: isRetirada ? user?.bairro : bairro.trim(),
        referencia: isRetirada ? user?.referencia : referencia.trim(),
      });
      console.log("[Checkout] Dados do cliente salvos");

      await clearCart();
      console.log("[Checkout] Carrinho limpo");

      Alert.alert(
        "Pedido realizado! 🎉",
        "Seu pedido foi enviado com sucesso. Acompanhe o status na aba Pedidos.",
        [
          {
            text: "Ver Pedidos",
            onPress: () => {
              router.dismissAll();
              router.replace("/(tabs)/pedidos");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.message || "Não foi possível enviar seu pedido. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [nome, telefone, rua, numero, complemento, bairro, referencia, isRetirada, formaPagamento, observacao, precisaTroco, trocoPara, cart, total, clearCart, updateUser, user, router]);

  if (cart.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
      <View style={styles.card}>
        {cart.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQtde}>{item.qtde}x</Text>
            <Text style={styles.itemNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.itemPreco}>
              {formatBRL(item.preco * item.qtde)}
            </Text>
            <TouchableOpacity
              onPress={() => removeItem(item.id)}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color="#e63946" />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(total)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Seus dados</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.label}>Telefone (WhatsApp) *</Text>
        <TextInput
          style={styles.input}
          placeholder="(00) 00000-0000"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          returnKeyType="next"
        />
      </View>

      <Text style={styles.sectionTitle}>Entrega</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Retirar no local</Text>
          <Switch
            value={isRetirada}
            onValueChange={setIsRetirada}
            trackColor={{ true: BRAND_COLOR }}
            thumbColor={isRetirada ? "#fff" : "#f4f4f4"}
          />
        </View>

        {!isRetirada && (
          <>
            <View style={styles.row}>
              <View style={styles.flex3}>
                <Text style={styles.label}>Rua *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rua"
                  value={rua}
                  onChangeText={setRua}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Nº</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nº"
                  value={numero}
                  onChangeText={setNumero}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.label}>Complemento</Text>
            <TextInput
              style={styles.input}
              placeholder="Apto, bloco... (opcional)"
              value={complemento}
              onChangeText={setComplemento}
            />
            <Text style={styles.label}>Bairro *</Text>
            <TextInput
              style={styles.input}
              placeholder="Bairro"
              value={bairro}
              onChangeText={setBairro}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Referência</Text>
            <TextInput
              style={styles.input}
              placeholder="Ponto de referência (opcional)"
              value={referencia}
              onChangeText={setReferencia}
            />
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Pagamento</Text>
      <View style={styles.card}>
        <View style={styles.paymentOptions}>
          {formasPagamento.map((fp) => (
            <TouchableOpacity
              key={fp.value}
              style={[
                styles.paymentOption,
                formaPagamento === fp.value && styles.paymentOptionSelected,
              ]}
              onPress={() => {
                setFormaPagamento(fp.value);
                if (fp.value !== "dinheiro") setPrecisaTroco(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  formaPagamento === fp.value && styles.paymentOptionTextSelected,
                ]}
              >
                {fp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formaPagamento === "dinheiro" && (
          <>
            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <Text style={styles.switchLabel}>Precisa de troco?</Text>
              <Switch
                value={precisaTroco}
                onValueChange={setPrecisaTroco}
                trackColor={{ true: BRAND_COLOR }}
                thumbColor={precisaTroco ? "#fff" : "#f4f4f4"}
              />
            </View>
            {precisaTroco && (
              <>
                <Text style={styles.label}>Troco para quanto?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50.00"
                  value={trocoPara}
                  onChangeText={setTrocoPara}
                  keyboardType="decimal-pad"
                />
              </>
            )}
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Observação</Text>
      <View style={styles.card}>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Alguma observação? (opcional)"
          value={observacao}
          onChangeText={setObservacao}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Fazer Pedido 🛒</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  itemQtde: {
    fontSize: 14,
    color: BRAND_COLOR,
    fontWeight: "600",
    width: 28,
  },
  itemNome: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  itemPreco: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  inputMultiline: {
    height: 80,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flex3: {
    flex: 3,
  },
  flex1: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 15,
    color: "#1a1a1a",
  },
  submitButton: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    elevation: 3,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  paymentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  paymentOptionSelected: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff0f0",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  paymentOptionTextSelected: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
});
