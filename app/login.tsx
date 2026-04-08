import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { registerUser, loginUser, sendVerificationCode } from "@/lib/api";
import { BRAND_COLOR, BRAND_COLOR_DARK, BRAND_SECONDARY } from "@/constants/categories";

function getPasswordStrength(senha: string): { label: string; color: string } {
  if (senha.length < 6) return { label: "", color: "transparent" };
  const hasUpper = /[A-Z]/.test(senha);
  const hasLower = /[a-z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);
  const hasSpecial = /[^A-Za-z0-9]/.test(senha);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial, senha.length >= 8].filter(Boolean).length;
  if (score >= 4) return { label: "✓ Senha forte", color: "#155724" };
  if (score >= 3) return { label: "Senha média", color: BRAND_SECONDARY };
  return { label: "Senha fraca", color: BRAND_COLOR };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification step
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  // Register fields
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");

  // Touch tracking for email validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [loginEmailTouched, setLoginEmailTouched] = useState(false);

  const passwordStrength = getPasswordStrength(senha);

  const handleRegister = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Por favor, informe seu nome.");
      return;
    }
    if (!telefone.trim()) {
      Alert.alert("Atenção", "Por favor, informe seu telefone.");
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      Alert.alert("Atenção", "Por favor, informe um email válido.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    if (!verificationStep) {
      // Step 1: Send verification code
      setIsSubmitting(true);
      try {
        await sendVerificationCode(telefone.trim());
        setVerificationStep(true);
        startResendCooldown();
        Alert.alert("Código enviado", "Um código de verificação foi enviado para seu telefone.");
      } catch {
        Alert.alert("Erro", "Não foi possível enviar o código de verificação. Verifique o telefone.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Step 2: Register with verification code
    if (verificationCode.length !== 6) {
      Alert.alert("Atenção", "Digite o código de 6 dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
        rua: rua.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        referencia: referencia.trim() || undefined,
        verification_code: verificationCode,
      });

      await login({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim().toLowerCase(),
        rua: rua.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        referencia: referencia.trim() || undefined,
      });

      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "Não foi possível criar sua conta. Verifique o código e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    try {
      await sendVerificationCode(telefone.trim());
      startResendCooldown();
      Alert.alert("Código reenviado", "Um novo código foi enviado para seu telefone.");
    } catch {
      Alert.alert("Erro", "Não foi possível reenviar o código.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !isValidEmail(loginEmail)) {
      Alert.alert("Atenção", "Por favor, informe um email válido.");
      return;
    }
    if (!loginSenha.trim()) {
      Alert.alert("Atenção", "Por favor, informe sua senha.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginUser({
        email: loginEmail.trim().toLowerCase(),
        password: loginSenha,
      });

      const cliente = data.cliente;
      await login({
        nome: cliente.cliente_nome,
        telefone: cliente.cliente_telefone,
        email: cliente.email,
        rua: cliente.rua,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        referencia: cliente.referencia,
      });

      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("LOGIN ERROR:", err?.message || err);
      Alert.alert("Erro", err?.message || "Email ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRegister) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.headerInCard}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.titleLogin}>Bem-vindo!</Text>
              <Text style={styles.subtitleLogin}>Faça login na sua conta</Text>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                loginEmailTouched && loginEmail.length > 0 && !isValidEmail(loginEmail) && styles.inputError,
              ]}
              placeholder="seu@email.com"
              value={loginEmail}
              onChangeText={setLoginEmail}
              onBlur={() => setLoginEmailTouched(true)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            {loginEmailTouched && loginEmail.length > 0 && !isValidEmail(loginEmail) && (
              <Text style={styles.errorHint}>Email inválido. Verifique o formato.</Text>
            )}

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              value={loginSenha}
              onChangeText={setLoginSenha}
              secureTextEntry
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.toggleButtonInCard}
              onPress={() => setIsRegister(true)}
            >
              <Text style={styles.toggleTextNormal}>
                Não tem conta?{" "}
                <Text style={styles.toggleTextBold}>Registre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Text style={styles.titleRegister}>Registre-se</Text>
          <Text style={styles.subtitle}>Crie sua conta para acompanhar pedidos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="João Silva"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              emailTouched && email.length > 0 && !isValidEmail(email) && styles.inputError,
            ]}
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          {emailTouched && email.length > 0 && !isValidEmail(email) && (
            <Text style={styles.errorHint}>Email inválido. Verifique o formato.</Text>
          )}

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            returnKeyType="next"
          />
          {senha.length > 0 && (
            <Text style={[styles.strengthHint, { color: passwordStrength.color }]}>
              {passwordStrength.label}
            </Text>
          )}

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            returnKeyType="next"
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>

          <View style={styles.row}>
            <View style={styles.flex3}>
              <TextInput
                style={styles.input}
                placeholder="Rua"
                value={rua}
                onChangeText={setRua}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                placeholder="Nº"
                value={numero}
                onChangeText={setNumero}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.inputSpacing]}
            placeholder="Complemento (opcional)"
            value={complemento}
            onChangeText={setComplemento}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <TextInput
            style={[styles.input, styles.inputSpacing]}
            placeholder="Bairro"
            value={bairro}
            onChangeText={setBairro}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <TextInput
            style={[styles.input, styles.inputSpacing]}
            placeholder="Referência (opcional)"
            value={referencia}
            onChangeText={setReferencia}
            autoCapitalize="sentences"
            returnKeyType="done"
          />

          {verificationStep && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Verificação por SMS</Text>
              <Text style={styles.verificationHint}>
                Digite o código de 6 dígitos enviado para {telefone}
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                value={verificationCode}
                onChangeText={(t) => setVerificationCode(t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resendCooldown > 0}
              >
                <Text style={[styles.resendText, resendCooldown > 0 && { color: "#999" }]}>
                  {resendCooldown > 0
                    ? `Reenviar código em ${resendCooldown}s`
                    : "Reenviar código"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {verificationStep ? "Criar Conta" : "Enviar Código"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsRegister(false)}
        >
          <Text style={styles.toggleTextNormal}>
            Já tem conta?{" "}
            <Text style={styles.toggleTextBold}>Faça login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerInCard: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 12,
  },
  logoSmall: {
    width: 160,
    height: 80,
    marginBottom: 8,
  },
  brand: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: BRAND_COLOR,
    marginBottom: 4,
  },
  titleLogin: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  titleRegister: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  subtitleLogin: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 6,
    marginTop: 14,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff0f0",
  },
  inputSpacing: {
    marginTop: 10,
  },
  errorHint: {
    color: BRAND_COLOR,
    fontSize: 12,
    marginTop: 4,
  },
  strengthHint: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
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
  submitButton: {
    backgroundColor: BRAND_SECONDARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    elevation: 3,
    shadowColor: BRAND_COLOR_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 8,
  },
  toggleButtonInCard: {
    alignItems: "center",
    paddingVertical: 4,
  },
  forgotButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  forgotText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
  toggleTextNormal: {
    fontSize: 14,
    color: "#555",
  },
  toggleTextBold: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  verificationHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "700",
  },
  resendButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  resendText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
});
