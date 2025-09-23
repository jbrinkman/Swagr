import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { validateAuthForm, sanitizeInput } from "../utils/validation";
import { AuthFormData, AuthenticationError } from "../types";

const AuthScreen: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof AuthFormData | "confirmPassword", string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setConfirmPassword(sanitizedValue);

    // Clear confirm password error when user starts typing
    if (errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const validation = validateAuthForm(formData, isSignUp, confirmPassword);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred";

      if (error instanceof AuthenticationError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Authentication Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setConfirmPassword("");
  };

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setConfirmPassword("");
    setErrors({});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Title>
            <Paragraph style={styles.subtitle}>
              {isSignUp
                ? "Sign up to start managing your marketing contacts"
                : "Sign in to access your marketing checklist"}
            </Paragraph>

            <View style={styles.form}>
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                style={styles.input}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                mode="outlined"
                secureTextEntry
                autoComplete={isSignUp ? "new-password" : "current-password"}
                error={!!errors.password}
                style={styles.input}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              {isSignUp && (
                <>
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    mode="outlined"
                    secureTextEntry
                    autoComplete="new-password"
                    error={!!errors.confirmPassword}
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                  <HelperText type="error" visible={!!errors.confirmPassword}>
                    {errors.confirmPassword}
                  </HelperText>
                </>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <Button
                mode="text"
                onPress={toggleMode}
                disabled={isSubmitting}
                style={styles.toggleButton}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleButton: {
    marginTop: 8,
  },
});

export default AuthScreen;