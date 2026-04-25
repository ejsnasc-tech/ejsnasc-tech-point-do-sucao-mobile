import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { registerUser, loginUser, sendVerificationCode, forgotPassword, resetPassword } from "@/lib/api";
import { BRAND_COLOR, BRAND_COLOR_DARK, BRAND_SECONDARY } from "@/constants/categories";
import { BairroPicker } from "@/components/BairroPicker";
import type { Bairro } from "@/types/product";

const REMEMBER_KEY = "@pointdosucao:remember_login";

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

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  const digits = getPhoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();

  const goAfterAuth = () => {
    if (redirect && typeof redirect === "string" && redirect.startsWith("/")) {
      router.replace(redirect as any);
    } else {
      router.replace("/(tabs)");
    }
  };

  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification step
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Login fields
  const [loginTelefone, setLoginTelefone] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Carrega telefone salvo (se o usuário marcou "Lembrar meus dados" antes)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMEMBER_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { telefone?: string };
          if (saved?.telefone) {
            setLoginTelefone(formatPhone(saved.telefone));
            setRememberMe(true);
          }
        }
      } catch {
        // ignora
      }
    })();
  }, []);

  // Forgot password fields
  const [forgotTelefone, setForgotTelefone] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"phone" | "code" | "done">("phone");

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

  // Indica que o usuário já tentou submeter o cadastro — ativa marcação
  // visual nos campos obrigatórios em branco.
  const [registerSubmitted, setRegisterSubmitted] = useState(false);

  const passwordStrength = getPasswordStrength(senha);

  // Coleta erros de cada campo obrigatório.
  // Retorna lista vazia quando tudo está válido.
  const getRegisterErrors = (): { field: string; message: string }[] => {
    const errs: { field: string; message: string }[] = [];
    if (!nome.trim()) errs.push({ field: "nome", message: "Nome completo" });
    if (!isValidPhone(telefone))
      errs.push({ field: "telefone", message: "Telefone válido com DDD" });
    if (!email.trim() || !isValidEmail(email))
      errs.push({ field: "email", message: "Email válido" });
    if (senha.length < 6)
      errs.push({ field: "senha", message: "Senha (mínimo 6 caracteres)" });
    if (!confirmarSenha)
      errs.push({ field: "confirmarSenha", message: "Confirmação de senha" });
    else if (senha !== confirmarSenha)
      errs.push({ field: "confirmarSenha", message: "As senhas devem coincidir" });
    if (!rua.trim()) errs.push({ field: "rua", message: "Rua" });
    if (!numero.trim()) errs.push({ field: "numero", message: "Número" });
    if (!bairro.trim()) errs.push({ field: "bairro", message: "Bairro" });
    return errs;
  };

  const registerErrors = registerSubmitted ? getRegisterErrors() : [];
  const hasFieldError = (field: string) =>
    registerErrors.some((e) => e.field === field);

  const handleRegister = async () => {
    setRegisterSubmitted(true);
    const errs = getRegisterErrors();
    if (errs.length > 0) {
      const lista = errs.map((e) => `• ${e.message}`).join("\n");
      Alert.alert(
        "Preencha os campos abaixo",
        `Faltam as seguintes informações:\n\n${lista}`
      );
      return;
    }

    if (!verificationStep) {
      // Step 1: Send verification code
      setIsSubmitting(true);
      try {
        await sendVerificationCode(getPhoneDigits(telefone));
        setVerificationStep(true);
        startResendCooldown();
        Alert.alert("Código enviado", "Um código de verificação foi enviado pelo WhatsApp para seu telefone.");
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
        cliente_telefone: getPhoneDigits(telefone),
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
        telefone: getPhoneDigits(telefone),
        email: email.trim().toLowerCase(),
        rua: rua.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        referencia: referencia.trim() || undefined,
      });

      goAfterAuth();
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.message || "Não foi possível criar sua conta. Verifique o código e tente novamente."
      );
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
      await sendVerificationCode(getPhoneDigits(telefone));
      startResendCooldown();
      Alert.alert("Código reenviado", "Um novo código foi enviado pelo WhatsApp para seu telefone.");
    } catch {
      Alert.alert("Erro", "Não foi possível reenviar o código.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!isValidPhone(loginTelefone)) {
      Alert.alert("Atenção", "Informe um telefone válido com DDD.");
      return;
    }
    if (!loginSenha.trim()) {
      Alert.alert("Atenção", "Por favor, informe sua senha.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginUser({
        telefone: getPhoneDigits(loginTelefone),
        password: loginSenha,
      });

      const cliente = data.cliente;
      // A API retorna o telefone no campo `telefone` (formatado, ex: "(79) 99602-5950").
      // Mantemos apenas dígitos para uso interno (consultas, etc.).
      const telefoneRaw = cliente.cliente_telefone ?? cliente.telefone ?? "";
      const telefoneDigits = getPhoneDigits(telefoneRaw);
      await login({
        nome: cliente.cliente_nome,
        telefone: telefoneDigits,
        email: cliente.email,
        rua: cliente.rua,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        referencia: cliente.referencia,
      });

      // Salva ou limpa o telefone lembrado conforme a escolha do usuário.
      // Senha NUNCA é armazenada por motivos de segurança.
      try {
        if (rememberMe) {
          await AsyncStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({ telefone: telefoneDigits })
          );
        } else {
          await AsyncStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // ignora
      }

      goAfterAuth();
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Telefone ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (forgotStep === "phone") {
      if (!isValidPhone(forgotTelefone)) {
        Alert.alert("Atenção", "Informe um telefone válido com DDD.");
        return;
      }
      setIsSubmitting(true);
      try {
        await forgotPassword(getPhoneDigits(forgotTelefone));
        setForgotStep("code");
        startResendCooldown();
        Alert.alert("Código enviado", "Um código foi enviado pelo WhatsApp para seu telefone.");
      } catch {
        Alert.alert("Erro", "Não foi possível enviar o código. Verifique o telefone.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (forgotStep === "code") {
      if (forgotCode.length !== 6) {
        Alert.alert("Atenção", "Digite o código de 6 dígitos.");
        return;
      }
      if (forgotNewPassword.length < 6) {
        Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        Alert.alert("Atenção", "As senhas não coincidem.");
        return;
      }
      setIsSubmitting(true);
      try {
        await resetPassword({
          telefone: getPhoneDigits(forgotTelefone),
          code: forgotCode,
          new_password: forgotNewPassword,
        });
        Alert.alert("Sucesso", "Senha redefinida com sucesso! Faça login.");
        setIsForgotPassword(false);
        setForgotStep("phone");
        setForgotTelefone("");
        setForgotCode("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      } catch {
        Alert.alert("Erro", "Código inválido ou expirado. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResendForgotCode = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    try {
      await forgotPassword(getPhoneDigits(forgotTelefone));
      startResendCooldown();
      Alert.alert("Código reenviado", "Um novo código foi enviado pelo WhatsApp para seu telefone.");
    } catch {
      Alert.alert("Erro", "Não foi possível reenviar o código.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isForgotPassword) {
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
              <Text style={styles.titleLogin}>Esqueci minha senha</Text>
              <Text style={styles.subtitleLogin}>
                {forgotStep === "phone"
                  ? "Digite seu telefone cadastrado. Enviaremos um código pelo WhatsApp."
                  : "Digite o código recebido e sua nova senha."}
              </Text>
            </View>

            {forgotStep === "phone" && (
              <>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={[
                    styles.input,
                    forgotTelefone.length > 0 && !isValidPhone(forgotTelefone) && styles.inputError,
                    forgotTelefone.length > 0 && isValidPhone(forgotTelefone) && styles.inputSuccess,
                  ]}
                  placeholder="(79) 99988-7188"
                  value={forgotTelefone}
                  onChangeText={(text) => setForgotTelefone(formatPhone(text))}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </>
            )}

            {forgotStep === "code" && (
              <>
                <Text style={styles.label}>Código de verificação</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  value={forgotCode}
                  onChangeText={(t) => setForgotCode(t.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendForgotCode}
                  disabled={resendCooldown > 0}
                >
                  <Text style={[styles.resendText, resendCooldown > 0 && { color: "#999" }]}>
                    {resendCooldown > 0
                      ? `Reenviar código em ${resendCooldown}s`
                      : "Reenviar código"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  secureTextEntry
                />

                <Text style={styles.label}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repita a nova senha"
                  value={forgotConfirmPassword}
                  onChangeText={setForgotConfirmPassword}
                  secureTextEntry
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {forgotStep === "phone" ? "Enviar Código" : "Redefinir Senha"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.toggleButtonInCard}
              onPress={() => {
                setIsForgotPassword(false);
                setForgotStep("phone");
                setForgotTelefone("");
                setForgotCode("");
                setForgotNewPassword("");
                setForgotConfirmPassword("");
              }}
            >
              <Text style={styles.toggleTextNormal}>
                Lembrou a senha?{" "}
                <Text style={styles.toggleTextBold}>Fazer login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={[
                styles.input,
                loginTelefone.length > 0 && !isValidPhone(loginTelefone) && styles.inputError,
                loginTelefone.length > 0 && isValidPhone(loginTelefone) && styles.inputSuccess,
              ]}
              placeholder="(79) 99988-7188"
              value={loginTelefone}
              onChangeText={(text) => setLoginTelefone(formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
              returnKeyType="next"
            />

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
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.rememberText}>Lembrar meu telefone</Text>
            </TouchableOpacity>

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

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => setIsForgotPassword(true)}
            >
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

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.7}
            >
              <Text style={styles.guestText}>Continuar sem conta</Text>
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
            style={[styles.input, hasFieldError("nome") && styles.inputError]}
            placeholder="João Silva"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {hasFieldError("nome") && (
            <Text style={styles.errorHint}>Informe seu nome.</Text>
          )}

          <Text style={styles.label}>Telefone (com DDD)</Text>
          <TextInput
            style={[
              styles.input,
              telefone.length > 0 && !isValidPhone(telefone) && styles.inputError,
              telefone.length > 0 && isValidPhone(telefone) && styles.inputSuccess,
            ]}
            placeholder="(79) 99988-7188"
            value={telefone}
            onChangeText={(text) => setTelefone(formatPhone(text))}
            keyboardType="phone-pad"
            maxLength={15}
            returnKeyType="next"
          />
          {telefone.length > 0 && !isValidPhone(telefone) && (
            <Text style={styles.errorHint}>Informe DDD + número (10 ou 11 dígitos)</Text>
          )}
          {telefone.length > 0 && isValidPhone(telefone) && (
            <Text style={styles.successHint}>✓ Telefone válido</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              emailTouched && email.length > 0 && !isValidEmail(email) && styles.inputError,
              hasFieldError("email") && styles.inputError,
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
            style={[styles.input, hasFieldError("senha") && styles.inputError]}
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
            style={[styles.input, hasFieldError("confirmarSenha") && styles.inputError]}
            placeholder="Repita a senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            returnKeyType="next"
          />
          {hasFieldError("confirmarSenha") && (
            <Text style={styles.errorHint}>
              {!confirmarSenha
                ? "Confirme sua senha."
                : "As senhas não coincidem."}
            </Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>

          <View style={styles.row}>
            <View style={styles.flex3}>
              <TextInput
                style={[styles.input, hasFieldError("rua") && styles.inputError]}
                placeholder="Rua"
                value={rua}
                onChangeText={setRua}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={styles.flex1}>
              <TextInput
                style={[styles.input, hasFieldError("numero") && styles.inputError]}
                placeholder="Nº"
                value={numero}
                onChangeText={setNumero}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>
          {(hasFieldError("rua") || hasFieldError("numero")) && (
            <Text style={styles.errorHint}>Informe a rua e o número.</Text>
          )}

          <TextInput
            style={[styles.input, styles.inputSpacing]}
            placeholder="Complemento (opcional)"
            value={complemento}
            onChangeText={setComplemento}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <BairroPicker
            value={bairro}
            hasError={hasFieldError("bairro")}
            onSelect={(b: Bairro) => setBairro(b.nome)}
          />
          {hasFieldError("bairro") && (
            <Text style={styles.errorHint}>Selecione um bairro atendido.</Text>
          )}

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
              <Text style={styles.sectionTitle}>Verificação por WhatsApp</Text>
              <Text style={styles.verificationHint}>
                Digite o código de 6 dígitos enviado pelo WhatsApp para {telefone}
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
  inputSuccess: {
    borderColor: "#28a745",
    backgroundColor: "#f0fff4",
  },
  inputSpacing: {
    marginTop: 10,
  },
  errorHint: {
    color: BRAND_COLOR,
    fontSize: 12,
    marginTop: 4,
  },
  successHint: {
    color: "#155724",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
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
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLOR,
  },
  rememberText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  guestButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 10,
  },
  guestText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
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
