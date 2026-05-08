import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { requestPhoneChange, confirmPhoneChange } from "@/lib/api";
import { BRAND_COLOR } from "@/constants/categories";
import { LoginGate } from "@/components/LoginGate";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

export default function PerfilScreen() {
  const { user, updateUser, logout } = useAuth();

  if (!user) {
    return (
      <LoginGate
        title="Minha Conta"
        message="Entre para ver e editar suas informações pessoais e endereços."
      />
    );
  }
  return <PerfilForm />;
}

function PerfilForm() {
  const { user, updateUser, logout, deleteAccount } = useAuth();
  const { clearCart } = useCart();
  const [nome, setNome] = useState(user?.nome ?? "");
  const [email] = useState(user?.email ?? "");
  const [rua, setRua] = useState(user?.rua ?? "");
  const [numero, setNumero] = useState(user?.numero ?? "");
  const [complemento, setComplemento] = useState(user?.complemento ?? "");
  const [bairro, setBairro] = useState(user?.bairro ?? "");
  const [referencia, setReferencia] = useState(user?.referencia ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Phone change flow
  const [phoneChangeStep, setPhoneChangeStep] = useState<null | "choose" | "verify">(null);
  const [phoneChangeMethod, setPhoneChangeMethod] = useState<"sms" | "email">("sms");
  const [phoneChangeCode, setPhoneChangeCode] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [isChangingPhone, setIsChangingPhone] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe seu nome.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        nome: nome.trim(),
        rua: rua.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        referencia: referencia.trim() || undefined,
      });
      Alert.alert("Sucesso", "Dados atualizados!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair da conta", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await clearCart();
          await logout();
        },
      },
    ]);
  };

  const handleRequestPhoneChange = async (method: "sms" | "email") => {
    setIsChangingPhone(true);
    try {
      await requestPhoneChange(method);
      setPhoneChangeMethod(method);
      setPhoneChangeStep("verify");
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível enviar o código.");
    } finally {
      setIsChangingPhone(false);
    }
  };

  const handleConfirmPhoneChange = async () => {
    if (phoneChangeCode.trim().length !== 6) {
      Alert.alert("Atenção", "Digite o código de 6 dígitos.");
      return;
    }
    if (!isValidPhone(novoTelefone)) {
      Alert.alert("Atenção", "Informe um número de telefone válido com DDD.");
      return;
    }
    setIsChangingPhone(true);
    try {
      const result = await confirmPhoneChange(novoTelefone.replace(/\D/g, ""), phoneChangeCode.trim());
      await updateUser({ telefone: result.novo_telefone });
      setPhoneChangeStep(null);
      setPhoneChangeCode("");
      setNovoTelefone("");
      Alert.alert("Sucesso", "Número de telefone atualizado com sucesso!");
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Código inválido ou número já cadastrado.");
    } finally {
      setIsChangingPhone(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir conta",
      "Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await clearCart();
              await deleteAccount();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir sua conta. Tente novamente.");
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.userName}>{user?.nome ?? "Usuário"}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
        </View>

        <Text style={styles.sectionTitle}>Dados pessoais</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholderTextColor="#aaa"
            placeholder="Seu nome completo"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Telefone (WhatsApp)</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.telefone ?? ""}
            editable={false}
          />

          {phoneChangeStep === null && (
            <TouchableOpacity onPress={() => setPhoneChangeStep("choose")} activeOpacity={0.7}>
              <Text style={styles.changePhoneLink}>Alterar telefone</Text>
            </TouchableOpacity>
          )}

          {phoneChangeStep === "choose" && (
            <View style={styles.phoneChangeBox}>
              <Text style={styles.phoneChangeTitle}>Como deseja verificar sua identidade?</Text>
              <TouchableOpacity
                style={[styles.phoneMethodBtn, isChangingPhone && { opacity: 0.5 }]}
                onPress={() => handleRequestPhoneChange("sms")}
                disabled={isChangingPhone}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={16} color={BRAND_COLOR} />
                <Text style={styles.phoneMethodText}>SMS para número atual</Text>
              </TouchableOpacity>
              {!!user?.email && (
                <TouchableOpacity
                  style={[styles.phoneMethodBtn, isChangingPhone && { opacity: 0.5 }]}
                  onPress={() => handleRequestPhoneChange("email")}
                  disabled={isChangingPhone}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail-outline" size={16} color={BRAND_COLOR} />
                  <Text style={styles.phoneMethodText}>Código por email</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Sem acesso?",
                    "Caso não tenha acesso ao número atual nem ao email cadastrado, crie uma nova conta com o novo número."
                  )
                }
              >
                <Text style={styles.noAccessLink}>Não tenho acesso a nenhuma dessas opções</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPhoneChangeStep(null)}>
                <Text style={styles.cancelLink}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {phoneChangeStep === "verify" && (
            <View style={styles.phoneChangeBox}>
              <Text style={styles.phoneChangeTitle}>
                Código enviado {phoneChangeMethod === "sms" ? "por SMS" : "por email"}
              </Text>
              <TextInput
                style={styles.input}
                value={phoneChangeCode}
                onChangeText={(t) => setPhoneChangeCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholderTextColor="#aaa"
                placeholderTextColor="#aaa"
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={[styles.label, { marginTop: 12 }]}>Novo número de telefone</Text>
              <TextInput
                style={styles.input}
                value={novoTelefone}
                onChangeText={(v) => setNovoTelefone(formatPhone(v))}
                placeholderTextColor="#aaa"
                placeholderTextColor="#aaa"
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.saveButton, { marginTop: 12 }, isChangingPhone && styles.saveButtonDisabled]}
                onPress={handleConfirmPhoneChange}
                disabled={isChangingPhone}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>
                  {isChangingPhone ? "Verificando..." : "Confirmar novo número"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Sem acesso?",
                    "Caso não tenha acesso ao número atual nem ao email cadastrado, crie uma nova conta com o novo número."
                  )
                }
              >
                <Text style={styles.noAccessLink}>
                  Não tenho acesso ao {phoneChangeMethod === "sms" ? "número atual" : "email"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPhoneChangeStep(null);
                  setPhoneChangeCode("");
                  setNovoTelefone("");
                }}
              >
                <Text style={styles.cancelLink}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
          />
        </View>

        <Text style={styles.sectionTitle}>Endereço de entrega</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex3}>
              <Text style={styles.label}>Rua</Text>
              <TextInput
                style={styles.input}
                value={rua}
                onChangeText={setRua}
                placeholderTextColor="#aaa"
                placeholder="Rua"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.label}>Nº</Text>
              <TextInput
                style={styles.input}
                value={numero}
                onChangeText={setNumero}
                placeholderTextColor="#aaa"
                placeholder="Nº"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Complemento</Text>
          <TextInput
            style={styles.input}
            value={complemento}
            onChangeText={setComplemento}
            placeholderTextColor="#aaa"
            placeholder="Apto, bloco... (opcional)"
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            value={bairro}
            onChangeText={setBairro}
            placeholderTextColor="#aaa"
            placeholder="Bairro"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Referência</Text>
          <TextInput
            style={styles.input}
            value={referencia}
            onChangeText={setReferencia}
            placeholderTextColor="#aaa"
            placeholder="Ponto de referência (opcional)"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={BRAND_COLOR} />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
          <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  userName: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  userEmail: { fontSize: 14, color: "#888", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
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
  label: { fontSize: 13, color: "#555", marginBottom: 6, marginTop: 12 },
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
  inputDisabled: { backgroundColor: "#f0f0f0", color: "#999" },
  row: { flexDirection: "row", gap: 10 },
  flex3: { flex: 3 },
  flex1: { flex: 1 },
  saveButton: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    elevation: 3,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  logoutButtonText: { color: BRAND_COLOR, fontSize: 16, fontWeight: "700" },
  changePhoneLink: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  phoneChangeBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  phoneChangeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  phoneMethodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
  },
  phoneMethodText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  noAccessLink: {
    color: "#888",
    fontSize: 12,
    textDecorationLine: "underline",
    marginTop: 4,
    textAlign: "center",
  },
  cancelLink: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  deleteButtonText: { color: "#dc2626", fontSize: 16, fontWeight: "700" },
});
