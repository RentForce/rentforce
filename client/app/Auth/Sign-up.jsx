import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SweetAlert from "../../components/SweetAlert";

export default function SignUpScreen({ navigation }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "",
  });
const Apiurl = process.env.EXPO_PUBLIC_API_URL
console.log(Apiurl , "url");
  const validatePassword = (password) => {
    const errors = [];
    const passwordChecking =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (password.length < 8) {
      errors.push("Password must contain at least 8 characters.");
    }
    if (!passwordChecking.test(password)) {
      errors.push(
        "Password must contain at least one upper case, one lower case, and one symbol"
      );
    }
    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  const handleSignUp = async () => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setAlertConfig({
        title: "Weak Password",
        message: passwordValidation.errors.join(" "),
        type: "error",
      });
      setShowAlert(true);
      return;
    }

    const userData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber: countryCode + phoneNumber,
    };

    try {
      
      const response = await fetch(`${Apiurl}/user/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertConfig({
          title: "Success",
          message: "Account created successfully",
          type: "success",
        });
        setShowAlert(true);
      } else {
        setAlertConfig({
          title: "Error",
          message: data.message || "Something went wrong",
          type: "error",
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setAlertConfig({
        title: "Error",
        message: "Failed to create account",
        type: "error",
      });
      setShowAlert(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["rgba(61,85,96,1)", "rgba(144,146,150,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Enter your Personal Data</Text>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <FontAwesome name="user" size={20} color="black" style={styles.icon} />
              <TextInput
                placeholder="First Name"
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <FontAwesome name="user" size={20} color="black" style={styles.icon} />
              <TextInput
                placeholder="Last Name"
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="phone" size={20} color="black" style={styles.icon} />
            <TextInput
              placeholder="Country Code"
              style={styles.countryCode}
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Phone Number"
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome
              name="envelope"
              size={20}
              color="black"
              style={styles.icon}
            />
            <TextInput
              placeholder="Email Address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <FontAwesome
              name="lock"
              size={20}
              color="black"
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <FontAwesome
              name={passwordVisible ? "eye-slash" : "eye"}
              size={20}
              color="black"
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("login")}
            style={styles.loginLink}
          >
            <Text style={styles.accountText}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <SweetAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setShowAlert(false);
          if (alertConfig.type === "success") {
            navigation.navigate("login");
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    width: "90%",
    alignItems: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    marginTop: 50,
  },
  subtitle: {
    fontSize: 20, // Adjusted for better responsiveness
    color: "#909296",
    marginVertical: 20,
    textAlign: "center",
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  halfWidth: {
    flex: 0.48, // Using flex instead of percentage width for better responsiveness
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    width: "100%",
    padding: 10,
    marginVertical: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  button: {
    backgroundColor: "#1A3C40",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 30,
  },
  accountText: {
    color: "white",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
