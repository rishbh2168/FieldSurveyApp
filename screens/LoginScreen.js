import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert("Login Failed", result.error);
    }
    // On success, AuthContext updates user → App.js switches to AppStack automatically
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Enter Email",
        "Please enter your email address first, then tap Forgot Password.",
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      `Send password reset email to ${email.trim()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            const result = await resetPassword(email.trim());
            if (result.success) {
              Alert.alert(
                "Email Sent",
                "Check your inbox for the password reset link.",
              );
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🔧</Text>
            <Text style={styles.headerTitle}>FieldSurvey Pro</Text>
            <Text style={styles.headerSubtitle}>Field Service Management</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="engineer@nec.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>NEC Asia Pacific • Smart City FSM</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: "#1a73e8",
    paddingVertical: 50,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 52, marginBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "800" },
  headerSubtitle: { color: "#c5d8ff", fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a2e" },
  cardSubtitle: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 24 },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f5f7ff",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eyeBtn: { padding: 10, marginLeft: 4 },
  eyeText: { fontSize: 20 },

  forgotText: {
    color: "#1a73e8",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 20,
  },

  loginBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: { fontSize: 13, color: "#666" },
  signupLink: { fontSize: 13, color: "#1a73e8", fontWeight: "700" },

  footer: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 11,
    marginTop: 30,
    marginBottom: 20,
  },
});
