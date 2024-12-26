import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { initSocket } from "../chat/Socket.js";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
import AsyncStorage from "@react-native-async-storage/async-storage";
import SweetAlert from '../../components/SweetAlert.jsx';
import { LinearGradient } from 'expo-linear-gradient';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/user/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      if (token) {
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));
        await AsyncStorage.setItem('userId', response.data.user.id.toString());
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));

        initSocket(process.env.EXPO_PUBLIC_API_URL);
        console.log("Token successfully stored:", user);
        
        navigation.navigate("Home", { updatedUser: user });
      }
    } catch (error) {
      console.error("Error:", error);
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
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcome}>Welcome Back!</Text>
      </View>
      
      <LinearGradient
        colors={['transparent', '#000000', '#000000', '#909296']}
        locations={[0.1, 0.3, 0.6, 0.8]}
        style={styles.gradient}
      />
      
      <View style={styles.inputsContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="black" style={styles.icon} />
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
          <FontAwesome name="lock" size={20} color="black" style={styles.icon} />
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  signin: {
    flex: 1,
    backgroundColor: "#909296",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "40%",
  },
  gradient: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    height: '30%',
    zIndex: 1,
    opacity: 1,
  },
  welcomeContainer: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    zIndex: 2,
  },
  welcome: {
    fontSize: 60,
    fontWeight: "bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inputsContainer: {
    position: 'absolute',
    top: '42%',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 10,
    marginBottom: 5,
  },
  icon: {
    marginRight: 12,
    color: "#1A3C40",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "right",
    marginTop: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1A3C40",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  socialLoginContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  socialLoginText: {
    fontSize: 14,
    color: "#b6b6b6",
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginHorizontal: 10,
  },
  iconBox: {
    backgroundColor: "#909296",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "white",
  },
  socialIcon: {
    color: "#fff",
  },
});

export default Login;