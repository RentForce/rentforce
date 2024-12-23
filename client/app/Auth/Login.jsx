import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SweetAlert from '../../components/SweetAlert';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: '',
  });

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/user/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      if (token) {
        // Securely store the token
        await AsyncStorage.setItem("userToken", token);

        // Optional: Â²Store user info if needed
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        console.log("Token successfully stored:", user);
        setAlertConfig({
          title: 'Login Successful',
          message: 'Welcome',
          type: 'success'
        });
        setShowAlert(true);
        
        navigation.navigate("Home", { updatedUser: user });
      }

      await AsyncStorage.setItem("userId", response.data.user.id.toString());
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem(
        "currentUser",
        JSON.stringify(response.data.user)
      );
    } catch (error) {
      console.error("Error:", error);
      setAlertConfig({
        title: 'Login Failed',
        message: 'Please check your credentials and try again.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <View style={styles.signin}>
      <Image
        style={styles.backgroundImage}
        resizeMode="cover"
        source={{
          uri: "https://64.media.tumblr.com/a64e82aaf7f19908d6461003902469c3/ba494dfd33843672-b2/s1280x1920/665eeb3a2dc55350f6668344557099385a99b6ea.jpg",
        }}
      />
      <Text style={styles.welcome}>Welcome Back!</Text>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputContainer}>
          <FontAwesome
            name="user"
            size={20}
            color="black"
            style={styles.icon}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <Text style={styles.inputLabel}>Password</Text>
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
        <TouchableOpacity onPress={() => navigation.navigate("forget")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            handleLogin();
          }}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>Or continue with</Text>
          <View style={styles.socialIcons}>
            <View style={styles.iconBox}>
              <FontAwesome
                name="google"
                size={30}
                color="white"
                style={styles.socialIcon}
              />
            </View>
            <View style={styles.iconBox}>
              <FontAwesome
                name="apple"
                size={30}
                color="white"
                style={styles.socialIcon}
              />
            </View>
            <View style={styles.iconBox}>
              <FontAwesome
                name="facebook"
                size={30}
                color="white"
                style={styles.socialIcon}
              />
            </View>
          </View>
        </View>
      </View>
      
      <SweetAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setShowAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  signin: {
    flex: 1,
    backgroundColor: "#818287",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "45%",
  },
  welcome: {
    fontSize: Platform.OS === 'ios' ? 48 : 42,
    fontWeight: "bold",
    color: "white",
    marginTop: "65%",
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
  },
  formContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#909296",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: "5%",
    paddingVertical: "6%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minHeight: "55%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    width: "100%",
    padding: Platform.OS === 'ios' ? 12 : 10,
    marginVertical: "2%",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    color: "black",
    paddingVertical: 8,
  },
  button: {
    backgroundColor: "#1A3C40",
    padding: Platform.OS === 'ios' ? 15 : 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
    marginVertical: "3%",
  },
  buttonText: {
    color: "white",
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: Platform.OS === 'ios' ? 14 : 12,
    fontWeight: "500",
    color: "#cbcbcb",
    fontFamily: "Poppins-Medium",
    marginBottom: "2%",
  },
  forgotPassword: {
    fontSize: Platform.OS === 'ios' ? 12 : 11,
    fontWeight: "500",
    color: "#0d2d3a",
    textAlign: "right",
    marginBottom: "5%",
  },
  socialLoginContainer: {
    alignItems: "center",
    marginTop: "4%",
  },
  socialLoginText: {
    fontSize: Platform.OS === 'ios' ? 14 : 12,
    color: "#b6b6b6",
    marginBottom: "3%",
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginHorizontal: "3%",
  },
  iconBox: {
    backgroundColor: "#909296",
    padding: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "white",
    marginHorizontal: "2%",
  },
  socialIcon: {
    color: "#fff",
  },
});

export default Login;