import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons"; // Import if you want to use icons
import SweetAlert from "../../components/SweetAlert";

function ResetPassword({ route, navigation }) {
  const { email, phoneNumber } = route.params;
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  console.log("Email:", email);
  console.log("Phone Number:", phoneNumber);

  const handleCodeSubmit = async () => {
    console.log(phoneNumber)
    if (!recoveryCode.trim()) {
      setAlertConfig({
        title: 'Error',
        message: 'Please enter the recovery code',
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/user/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          phoneNumber: phoneNumber,
          code: recoveryCode,
          method: email ? "email" : "sms",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Verification failed:", data);
        throw new Error(data.message || "Invalid code");
      }

      Alert.alert("Success", "Code verified successfully");
      setIsCodeVerified(true);
    } catch (error) {
      console.error("Error:", error);
      setAlertConfig({
        title: 'Error',
        message: error.message || "Failed to verify code",
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      setAlertConfig({
        title: 'Error',
        message: 'Please enter a new password',
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    const payload = {
      email: email,
      phoneNumber: phoneNumber,
      newPassword: newPassword,
      method: phoneNumber ? "sms" : "email",
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(`${apiUrl}/user/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setAlertConfig({
        title: 'Success',
        message: 'Password updated successfully',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error("Error:", error);
      setAlertConfig({
        title: 'Error',
        message: error.message || "Failed to update password",
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <LinearGradient
      colors={["rgba(61,85,96,1)", "rgba(144,146,150,1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Reset Password</Text>

      {/* Recovery Code Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Recovery Code"
          style={styles.input}
          value={recoveryCode}
          onChangeText={setRecoveryCode}
          keyboardType="numeric"
          maxLength={6}
          editable={!isCodeVerified} // Disable input after verification
        />
        {!isCodeVerified && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCodeSubmit}
          >
            <Text style={styles.submitButtonText}>Verify</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* New Password Input - Shows only after code verification */}
      {isCodeVerified && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="New Password"
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIcon}
          >
            <FontAwesome
              name={passwordVisible ? "eye-slash" : "eye"}
              size={20}
              color="black"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handlePasswordUpdate}
          >
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      )}

      <SweetAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setShowAlert(false);
          if (alertConfig.type === 'success' && alertConfig.message === 'Password updated successfully') {
            navigation.navigate("login");
          }
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  submitButton: {
    backgroundColor: "#1A3C40",
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  eyeIcon: {
    padding: 10,
  },
});

export default ResetPassword;
