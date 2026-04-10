import { generateUsername, supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = (type: "success" | "error" | "info", text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",          
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,          
    });
  };

  const handleRegister = async (type: "email" | "google") => {
    setLoading(true);

    try {
      if (type === "email") {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword || !confirmPassword) {
          throw new Error("Please fill in all fields");
        }

        if (trimmedPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (trimmedPassword.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          throw new Error("Please enter a valid email address");
        }

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            emailRedirectTo:
              Platform.OS === "web"
                ? window.location.origin + "/auth/callback"
                : "fourdata://auth/callback",
            data: {
              email: trimmedEmail,
              full_name: generateUsername(trimmedEmail),
              username: generateUsername(trimmedEmail),
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please log in instead.");
          } else if (error.message.includes("weak_password")) {
            throw new Error("Please choose a stronger password");
          } else {
            throw error;
          }
        }

        if (data.user?.identities?.length === 0) {
          throw new Error("This email is already registered");
        }

        await AsyncStorage.setItem("userEmail", trimmedEmail);

        // Success toast + navigation
        showToast(
          "success",
          "Check your email",
          "A confirmation email has been sent. Please verify to continue."
        );

        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 2500);
      }
    } catch (err: any) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";

      showToast("error", "Registration Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Create Account</Text>

      <View style={styles.form}>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={() => handleRegister("email")}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up with Email</Text>
          )}
        </TouchableOpacity>


        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  emailButton: {
    backgroundColor: "#007AFF",
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  icon: {
    marginRight: 10,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#888",
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
