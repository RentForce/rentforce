import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SweetAlert from "../../components/SweetAlert";

export default function ForgetPassword({ navigation }) {

  const [selectedOption, setSelectedOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: '',
  });
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setInputValue("");
  };

  const handleSubmit = async () => {
    if (selectedOption === "email" || selectedOption === "sms") {
      try {
        const response = await fetch(`${apiUrl}/user/send-code`, {
          method: "POST",
          headers: {
            "User-Agent":"Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "application/json",
            "Authorization":"App daa6aec38feddaf03cb3b0f318706f0d-5770c954-04d6-46cd-a3f7-9fd4abdd4e29",

          },
          body: JSON.stringify({
            [selectedOption]: inputValue,
            method: selectedOption,
          }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error data:", errorData);
          throw new Error(errorData);
        }

        const data = await response.json();
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: `Code sent to ${inputValue}`,
          type: 'success'
        });
      } catch (error) {
        console.error("Error:", error);
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Failed to send code',
          type: 'error'
        });
      }
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please select a recovery option',
        type: 'error'
      });
    }
  };

  const handleAlertConfirm = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === 'success') {
      navigation.navigate("reset", { [selectedOption]: inputValue });
    }
  };

  return (
    <LinearGradient
      colors={["rgba(61,85,96,1)", "rgba(144,146,150,1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Choose a recovery option</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === "sms" && styles.selectedOption,
          ]}
          onPress={() => handleOptionSelect("sms")}
        >
          <Text style={styles.optionText}>SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === "email" && styles.selectedOption,
          ]}
          onPress={() => handleOptionSelect("email")}
        >
          <Text style={styles.optionText}>Email</Text>
        </TouchableOpacity>
      </View>

      {selectedOption && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={`Enter your ${selectedOption}`}
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      <SweetAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={handleAlertConfirm}
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
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: "#909296",
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#1A3C40",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "40%",
  },
  selectedOption: {
    backgroundColor: "#3C6E71",
  },
  optionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
});