import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { initSocket } from "../chat/Socket.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

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
        navigation.navigate("Home", { updatedUser: user });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.signin}>
          <Image
            style={[styles.backgroundImage, { height: screenHeight * 0.4 }]}
            resizeMode="cover"
            source={{
              uri: "https://64.media.tumblr.com/a64e82aaf7f19908d6461003902469c3/ba494dfd33843672-b2/s1280x1920/665eeb3a2dc55350f6668344557099385a99b6ea.jpg",
            }}
          />
          
          <LinearGradient
            colors={['transparent', '#000000', '#000000', '#909296']}
            locations={[0.1, 0.3, 0.6, 0.8]}
            style={[styles.gradient, { height: screenHeight * 0.3 }]}
          />
          
          <View style={[styles.welcomeContainer, { top: screenHeight * 0.34 }]}>
            <Text style={[styles.welcome, { fontSize: screenWidth * 0.12 }]}>
              Welcome Back!
            </Text>
          </View>

          <View style={[styles.inputsContainer, { top: screenHeight * 0.42 }]}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="user" size={screenWidth * 0.05} color="black" style={styles.icon} />
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
              <FontAwesome name="lock" size={screenWidth * 0.05} color="black" style={styles.icon} />
              <TextInput
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <FontAwesome
                name={passwordVisible ? "eye-slash" : "eye"}
                size={screenWidth * 0.05}
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
                    size={screenWidth * 0.075}
                    color="white"
                    style={styles.socialIcon}
                  />
                </View>
                <View style={styles.iconBox}>
                  <FontAwesome
                    name="apple"
                    size={screenWidth * 0.075}
                    color="white"
                    style={styles.socialIcon}
                  />
                </View>
                <View style={styles.iconBox}>
                  <FontAwesome
                    name="facebook"
                    size={screenWidth * 0.075}
                    color="white"
                    style={styles.socialIcon}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  signin: {
    flex: 1,
    backgroundColor: "#909296",
    minHeight: Dimensions.get('window').height,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  },
  gradient: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    zIndex: 1,
    opacity: 1,
  },
  welcomeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: '6%',
    zIndex: 2,
  },
  welcome: {
    fontWeight: "bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inputsContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: '5%',
    zIndex: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    padding: '3%',
    marginVertical: '2%',
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
    marginTop: '3%',
    marginBottom: '1%',
  },
  icon: {
    marginRight: '3%',
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
    marginTop: '2%',
    marginBottom: '5%',
  },
  button: {
    backgroundColor: "#1A3C40",
    padding: '4%',
    borderRadius: 12,
    width: "100%",
    marginTop: '2%',
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
    marginTop: '3%',
  },
  socialLoginText: {
    fontSize: 14,
    color: "#b6b6b6",
    marginBottom: '3%',
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginHorizontal: '2%',
  },
  iconBox: {
    backgroundColor: "#909296",
    padding: '3%',
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