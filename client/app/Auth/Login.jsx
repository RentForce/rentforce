import React, { useState } from "react";
import { Image, StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios"; // Import axios for making HTTP requests

const Login = () => {
  const [email, setEmail] = useState(""); // State for username
  const [password, setPassword] = useState(""); // State for password
  const [passwordVisible, setPasswordVisible] = useState(false);


  const handleLogin = async () => {
    try {
      const response = await axios.post("http://192.168.104.13:5000/user/login", {
        email,
        password,
      });
      // Handle successful login
      Alert.alert("Login Successful welcome");
    } catch (error) {
      // Handle login error
      Alert.alert("Login Failed", "Please check your credentials and try again.");
    }
  };

  return (
    <View style={styles.signin}>
      <Image
        style={styles.backgroundImage}
        resizeMode="cover"
        source={{ uri: "https://64.media.tumblr.com/a64e82aaf7f19908d6461003902469c3/ba494dfd33843672-b2/s1280x1920/665eeb3a2dc55350f6668344557099385a99b6ea.jpg" }}
      />
      <Text style={styles.welcome}>Welcome Back!</Text>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="black" style={styles.icon} />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail} // Update username state
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
            onChangeText={setPassword} // Update password state
          />
          <FontAwesome
            name={passwordVisible ? "eye-slash" : "eye"}
            size={20}
            color="black"
            onPress={() => setPasswordVisible(!passwordVisible)}
          />
        </View>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>Or continue with</Text>
          <View style={styles.socialIcons}>
            <View style={styles.iconBox}>
              <FontAwesome name="google" size={30} color="white" style={styles.socialIcon} />
            </View>
            <View style={styles.iconBox}>
              <FontAwesome name="apple" size={30} color="white" style={styles.socialIcon} />
            </View>
            <View style={styles.iconBox}>
              <FontAwesome name="facebook" size={30} color="white" style={styles.socialIcon} />
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
    backgroundColor: "#818287",
    position: "relative",
  },
  button: {
    backgroundColor: '#1A3C40',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "49%",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    padding: 10,
    marginVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  formContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#909296",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  welcome: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 250,
    marginLeft: 25,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#cbcbcb",
    fontFamily: "Poppins-Medium",
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0d2d3a",
    textAlign: "right",
    marginBottom: 20,
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
    borderColor: 'white',
  },
  socialIcon: {
    color: "#fff",
  },
});

export default Login;