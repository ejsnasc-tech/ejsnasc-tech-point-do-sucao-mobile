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
import { BRAND_COLOR } from "@/constants/categories";
import { LoginGate } from "@/components/LoginGate";

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
  const { user, updateUser, logout } = useAuth();
  const { clearCart } = useCart();
  const [nome, setNome] = useState(user?.nome ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [email] = useState(user?.email ?? "");
  const [rua, setRua] = useState(user?.rua ?? "");
  const [numero, setNumero] = useState(user?.numero ?? "");
  const [complemento, setComplemento] = useState(user?.complemento ?? "");
  const [bairro, setBairro] = useState(user?.bairro ?? "");
  const [referencia, setReferencia] = useState(user?.referencia ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe seu nome.");
      return;
    }
    if (!telefone.trim()) {
      Alert.alert("Atenção", "Informe seu telefone.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        nome: nome.trim(),
        telefone: telefone.trim(),
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
          // Esvazia o carrinho ao sair: ele pertence à sessão do usuário.
          await clearCart();
          await logout();
        },
      },
    ]);
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
            placeholder="Seu nome completo"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Telefone (WhatsApp) *</Text>
          <TextInput
            style={styles.input}
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />

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
            placeholder="Apto, bloco... (opcional)"
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            value={bairro}
            onChangeText={setBairro}
            placeholder="Bairro"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Referência</Text>
          <TextInput
            style={styles.input}
            value={referencia}
            onChangeText={setReferencia}
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
});
