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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { createPedido, getBairros, getEnderecos, createEndereco, getStoreStatus } from "@/lib/api";
import { BRAND_COLOR } from "@/constants/categories";
import { LoginGate } from "@/components/LoginGate";
import type { Bairro, EnderecoSalvo } from "@/types/product";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CheckoutScreen() {
  const { user } = useAuth();

  // Bloqueia acesso ao checkout para convidados: precisa estar logado para
  // fazer pedido (mesma regra do site).
  if (!user) {
    return (
      <LoginGate
        title="Quase lá!"
        message="Para finalizar seu pedido, entre na sua conta ou crie uma agora."
        redirectTo="/checkout"
      />
    );
  }

  return <CheckoutForm />;
}

function CheckoutForm() {
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

  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroSelecionado, setBairroSelecionado] = useState<Bairro | null>(null);
  const [showBairroModal, setShowBairroModal] = useState(false);
  const [bairroSearch, setBairroSearch] = useState("");

  // Saved addresses
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoSalvo[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<EnderecoSalvo | null>(null);
  const [showNovoEndereco, setShowNovoEndereco] = useState(false);
  const [novoRua, setNovoRua] = useState("");
  const [novoNumero, setNovoNumero] = useState("");
  const [novoComplemento, setNovoComplemento] = useState("");
  const [novoBairro, setNovoBairro] = useState("");
  const [novoReferencia, setNovoReferencia] = useState("");
  const [novoBairroSelecionado, setNovoBairroSelecionado] = useState<Bairro | null>(null);
  const [showNovoBairroModal, setShowNovoBairroModal] = useState(false);
  const [novoBairroSearch, setNovoBairroSearch] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const activeBairro = enderecoSelecionado
    ? bairros.find((b) => b.nome.toLowerCase() === enderecoSelecionado.bairro.toLowerCase()) ?? bairroSelecionado
    : bairroSelecionado;
  const taxaEntrega = isRetirada ? 0 : (activeBairro?.taxa_entrega ?? 0);
  const totalComTaxa = total + taxaEntrega;

  // Carrega bairros da API
  useEffect(() => {
    getBairros()
      .then((data) => {
        const ativos = data.filter((b) => b.ativo === 1);
        ativos.sort((a, b) => a.nome.localeCompare(b.nome));
        setBairros(ativos);
      })
      .catch((err) => console.warn("[Checkout] Erro ao carregar bairros:", err));

    getEnderecos()
      .then((data) => {
        setEnderecosSalvos(data);
        const defaultAddr = data.find((e) => e.is_default === 1);
        if (defaultAddr) setEnderecoSelecionado(defaultAddr);
      })
      .catch((err) => console.warn("[Checkout] Erro ao carregar endereços:", err));
  }, []);

  // Preenche campos automaticamente quando user carrega do AsyncStorage
  useEffect(() => {
    if (user) {
      console.log("[Checkout] user loaded:", user.nome, "| telefone:", user.telefone);
      if (!nome) setNome(user.nome || "");
      if (!telefone) setTelefone(user.telefone || "");
      if (!rua) setRua(user.rua || "");
      if (!numero) setNumero(user.numero || "");
      if (!bairro) setBairro(user.bairro || "");
      if (!referencia) setReferencia(user.referencia || "");
    }
  }, [user]);

  // Auto-seleciona o bairro salvo do usuário quando os bairros carregam
  useEffect(() => {
    if (bairros.length > 0 && bairro && !bairroSelecionado) {
      const match = bairros.find(
        (b) => b.nome.toLowerCase() === bairro.toLowerCase()
      );
      if (match) setBairroSelecionado(match);
    }
  }, [bairros, bairro]);

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
    if (!isRetirada && !enderecoSelecionado && !rua.trim()) {
      Alert.alert("Atenção", "Por favor, selecione ou cadastre um endereço para entrega.");
      return;
    }
    if (!isRetirada && !enderecoSelecionado && !bairroSelecionado) {
      Alert.alert("Atenção", "Por favor, selecione o bairro para entrega.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Atenção", "Seu carrinho está vazio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const storeStatus = await getStoreStatus();
      if (!storeStatus.is_open) {
        Alert.alert(
          "Loja fechada",
          "Desculpe, no momento estamos fechados. Consulte nossos horários e tente novamente quando estivermos abertos."
        );
        setIsSubmitting(false);
        return;
      }

      const useAddr = enderecoSelecionado;
      const addrRua = isRetirada ? "Retirada" : (useAddr?.rua ?? rua.trim());
      const addrNumero = isRetirada ? "0" : ((useAddr?.numero ?? numero.trim()) || "S/N");
      const addrBairro = isRetirada ? "Centro" : (useAddr?.bairro ?? (activeBairro?.nome ?? ""));
      const addrComplemento = isRetirada ? undefined : ((useAddr?.complemento ?? complemento.trim()) || undefined);
      const addrReferencia = isRetirada ? undefined : ((useAddr?.referencia ?? referencia.trim()) || undefined);

      const enderecoEntrega = isRetirada
        ? "Retirada no local"
        : [addrRua, addrNumero, addrBairro].filter(Boolean).join(", ");

      const payload = {
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        endereco_entrega: enderecoEntrega,
        rua: addrRua,
        numero: addrNumero,
        complemento: addrComplemento,
        bairro: addrBairro,
        cidade: "Estância",
        referencia: addrReferencia,
        forma_pagamento: formaPagamento,
        observacao: isRetirada
          ? [observacao.trim(), "RETIRADA NO LOCAL"].filter(Boolean).join(" - ")
          : observacao.trim() || undefined,
        troco_para:
          formaPagamento === "dinheiro" && precisaTroco && trocoPara
            ? parseFloat(trocoPara)
            : undefined,
        subtotal: total,
        taxa_entrega: taxaEntrega,
        total: totalComTaxa,
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
        bairro: isRetirada ? user?.bairro : bairroSelecionado?.nome ?? "",
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
  }, [nome, telefone, rua, numero, complemento, bairroSelecionado, referencia, isRetirada, formaPagamento, observacao, precisaTroco, trocoPara, cart, total, taxaEntrega, totalComTaxa, clearCart, updateUser, user, router]);

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
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatBRL(total)}</Text>
        </View>
        {!isRetirada && (
          <View style={styles.totalRow}>
            <Text style={styles.subtotalLabel}>Taxa de entrega</Text>
            <Text style={styles.subtotalValue}>
              {taxaEntrega > 0 ? formatBRL(taxaEntrega) : bairroSelecionado ? "Grátis" : "Selecione o bairro"}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, { marginTop: 6 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(totalComTaxa)}</Text>
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
        <View style={styles.deliveryToggle}>
          <TouchableOpacity
            style={[styles.deliveryOption, !isRetirada && styles.deliveryOptionSelected]}
            onPress={() => setIsRetirada(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.deliveryOptionText, !isRetirada && styles.deliveryOptionTextSelected]}>
              Entrega
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deliveryOption, isRetirada && styles.deliveryOptionSelected]}
            onPress={() => setIsRetirada(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.deliveryOptionText, isRetirada && styles.deliveryOptionTextSelected]}>
              Retirar na loja
            </Text>
          </TouchableOpacity>
        </View>

        {!isRetirada && (
          <>
            {enderecosSalvos.length > 0 && (
              <>
                <Text style={styles.savedAddressTitle}>ENDEREÇOS SALVOS</Text>
                {enderecosSalvos.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.savedAddressCard,
                      enderecoSelecionado?.id === addr.id && styles.savedAddressCardSelected,
                    ]}
                    onPress={() => {
                      setEnderecoSelecionado(addr);
                      setShowNovoEndereco(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.savedAddressName}>
                      {addr.rua}, {addr.numero}
                    </Text>
                    <Text style={styles.savedAddressDetail}>
                      {addr.bairro}{addr.cidade ? ` - ${addr.cidade}` : ""}
                    </Text>
                    {addr.is_default === 1 && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Padrão</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {!showNovoEndereco && (
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => {
                  setShowNovoEndereco(true);
                  setEnderecoSelecionado(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={BRAND_COLOR} />
                <Text style={styles.addAddressText}>Novo endereço de entrega</Text>
              </TouchableOpacity>
            )}

            {(showNovoEndereco || enderecosSalvos.length === 0) && (
              <>
                <View style={styles.row}>
                  <View style={styles.flex3}>
                    <Text style={styles.label}>Rua *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Rua"
                      value={showNovoEndereco ? novoRua : rua}
                      onChangeText={showNovoEndereco ? setNovoRua : setRua}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Nº</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nº"
                      value={showNovoEndereco ? novoNumero : numero}
                      onChangeText={showNovoEndereco ? setNovoNumero : setNumero}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, bloco... (opcional)"
                  value={showNovoEndereco ? novoComplemento : complemento}
                  onChangeText={showNovoEndereco ? setNovoComplemento : setComplemento}
                />
                <Text style={styles.label}>Bairro *</Text>
                <TouchableOpacity
                  style={styles.bairroSelector}
                  onPress={() => showNovoEndereco ? setShowNovoBairroModal(true) : setShowBairroModal(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.bairroSelectorText,
                      !(showNovoEndereco ? novoBairroSelecionado : bairroSelecionado) && styles.bairroSelectorPlaceholder,
                    ]}
                  >
                    {(showNovoEndereco ? novoBairroSelecionado : bairroSelecionado)
                      ? `${(showNovoEndereco ? novoBairroSelecionado : bairroSelecionado)!.nome} — ${formatBRL((showNovoEndereco ? novoBairroSelecionado : bairroSelecionado)!.taxa_entrega)}`
                      : "Selecione o bairro"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </TouchableOpacity>
                <Text style={styles.label}>Referência</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ponto de referência (opcional)"
                  value={showNovoEndereco ? novoReferencia : referencia}
                  onChangeText={showNovoEndereco ? setNovoReferencia : setReferencia}
                />

                {showNovoEndereco && (
                  <View style={styles.newAddressActions}>
                    <TouchableOpacity
                      style={styles.saveAddressButton}
                      onPress={async () => {
                        const r = novoRua.trim();
                        const n = novoNumero.trim();
                        const b = novoBairroSelecionado?.nome ?? novoBairro.trim();
                        if (!r || !n || !b) {
                          Alert.alert("Atenção", "Rua, número e bairro são obrigatórios.");
                          return;
                        }
                        setIsSavingAddress(true);
                        try {
                          const saved = await createEndereco({
                            rua: r,
                            numero: n,
                            complemento: novoComplemento.trim() || undefined,
                            bairro: b,
                            cidade: "Estância",
                            referencia: novoReferencia.trim() || undefined,
                          });
                          setEnderecosSalvos((prev) => [...prev, saved]);
                          setEnderecoSelecionado(saved);
                          setShowNovoEndereco(false);
                          setNovoRua("");
                          setNovoNumero("");
                          setNovoComplemento("");
                          setNovoBairro("");
                          setNovoReferencia("");
                          setNovoBairroSelecionado(null);
                        } catch {
                          Alert.alert("Erro", "Não foi possível salvar o endereço.");
                        } finally {
                          setIsSavingAddress(false);
                        }
                      }}
                      disabled={isSavingAddress}
                      activeOpacity={0.7}
                    >
                      {isSavingAddress ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveAddressButtonText}>Salvar endereço</Text>
                      )}
                    </TouchableOpacity>
                    {enderecosSalvos.length > 0 && (
                      <TouchableOpacity
                        style={styles.cancelAddressButton}
                        onPress={() => {
                          setShowNovoEndereco(false);
                          const defaultAddr = enderecosSalvos.find((e) => e.is_default === 1) ?? enderecosSalvos[0];
                          if (defaultAddr) setEnderecoSelecionado(defaultAddr);
                        }}
                      >
                        <Text style={styles.cancelAddressText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            {enderecoSelecionado && activeBairro && (
              <Text style={styles.taxaInfo}>
                Taxa de entrega: {activeBairro.taxa_entrega > 0 ? formatBRL(activeBairro.taxa_entrega) : "Grátis"}
              </Text>
            )}
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

      {/* Modal de seleção de bairro */}
      <Modal
        visible={showBairroModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBairroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o bairro</Text>
              <TouchableOpacity onPress={() => setShowBairroModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar bairro..."
              value={bairroSearch}
              onChangeText={setBairroSearch}
              autoCapitalize="none"
            />
            <FlatList
              data={bairros.filter((b) =>
                b.nome.toLowerCase().includes(bairroSearch.toLowerCase())
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    bairroSelecionado?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setBairroSelecionado(item);
                    setBairro(item.nome);
                    setShowBairroModal(false);
                    setBairroSearch("");
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      bairroSelecionado?.id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemTaxa,
                      bairroSelecionado?.id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.taxa_entrega > 0 ? formatBRL(item.taxa_entrega) : "Grátis"}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmpty}>Nenhum bairro encontrado</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal de seleção de bairro para novo endereço */}
      <Modal
        visible={showNovoBairroModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNovoBairroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o bairro</Text>
              <TouchableOpacity onPress={() => setShowNovoBairroModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar bairro..."
              value={novoBairroSearch}
              onChangeText={setNovoBairroSearch}
              autoCapitalize="none"
            />
            <FlatList
              data={bairros.filter((b) =>
                b.nome.toLowerCase().includes(novoBairroSearch.toLowerCase())
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    novoBairroSelecionado?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setNovoBairroSelecionado(item);
                    setNovoBairro(item.nome);
                    setShowNovoBairroModal(false);
                    setNovoBairroSearch("");
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      novoBairroSelecionado?.id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemTaxa,
                      novoBairroSelecionado?.id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.taxa_entrega > 0 ? formatBRL(item.taxa_entrega) : "Grátis"}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmpty}>Nenhum bairro encontrado</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
  subtotalLabel: {
    fontSize: 13,
    color: "#888",
  },
  subtotalValue: {
    fontSize: 13,
    color: "#888",
  },
  bairroSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
  },
  bairroSelectorText: {
    fontSize: 15,
    color: "#1a1a1a",
    flex: 1,
  },
  bairroSelectorPlaceholder: {
    color: "#aaa",
  },
  taxaInfo: {
    fontSize: 12,
    color: BRAND_COLOR,
    marginTop: 4,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalSearch: {
    margin: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  modalItemSelected: {
    backgroundColor: "#fff0f0",
  },
  modalItemText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  modalItemTaxa: {
    fontSize: 14,
    color: BRAND_COLOR,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalItemTextSelected: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  modalEmpty: {
    textAlign: "center",
    color: "#999",
    padding: 20,
    fontSize: 14,
  },
  deliveryToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  deliveryOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  deliveryOptionSelected: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff0f0",
  },
  deliveryOptionText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  deliveryOptionTextSelected: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  savedAddressTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  savedAddressCard: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  savedAddressCardSelected: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff0f0",
  },
  savedAddressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  savedAddressDetail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    borderStyle: "dashed",
    paddingVertical: 14,
    marginTop: 4,
    gap: 6,
  },
  addAddressText: {
    fontSize: 14,
    color: BRAND_COLOR,
    fontWeight: "600",
  },
  newAddressActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  saveAddressButton: {
    flex: 1,
    backgroundColor: BRAND_COLOR,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveAddressButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelAddressButton: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cancelAddressText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});
