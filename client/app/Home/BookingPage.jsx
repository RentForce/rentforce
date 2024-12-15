import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Dialog from "react-native-dialog";
import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import HomeDetails from "./HomeDetails";

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BookingPage" component={BookingPage} />
      <Stack.Screen name="HomeDetails" component={HomeDetails} />
      {/* Add other screens here */}
    </Stack.Navigator>
  );
};

const BookingPage = ({ navigation }) => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [rentalDuration, setRentalDuration] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleBooking = () => {
    setDialogVisible(true);
  };

  const confirmBooking = () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const daysStayed = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    let totalPrice = amount * daysStayed;

    if (numberOfGuests > 2) {
      totalPrice *= numberOfGuests;
    }

    Alert.alert(
      "Confirm Booking",
      `Name: ${name}\nCountry: ${country}\nTotal Price: $${totalPrice.toFixed(
        2
      )}`,
      [
        {
          text: "Cancel",
          onPress: () => setDialogVisible(false),
          style: "cancel",
        },
        {
          text: "Yes, confirm it!",
          onPress: () => {
            setDialogVisible(false);
            Alert.alert(
              "Booking Confirmed",
              `Welcome ${name} from ${country}! Your total price is $${totalPrice.toFixed(
                2
              )}. Your order will be reviewed by the owner.`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    setName("");
                    setCountry("");
                    setRentalDuration("");
                    setPaymentAmount("");
                    setNumberOfGuests("");
                    setCheckInDate("");
                    setCheckOutDate("");
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "BookingPage" }],
                    });
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const cancelBooking = () => {
    setDialogVisible(false);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: dialogVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [dialogVisible]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Booking Information</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="home-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.pickerContainer}>
          <Ionicons
            name="globe-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <Picker
            selectedValue={country}
            style={styles.picker}
            onValueChange={(itemValue) => setCountry(itemValue)}
          >
            <Picker.Item label="Select Your Country" value="" />
            <Picker.Item label="USA" value="USA" />
            <Picker.Item label="Canada" value="Canada" />
            <Picker.Item label="UK" value="UK" />
          </Picker>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Rental Duration (days)"
            keyboardType="numeric"
            value={rentalDuration}
            onChangeText={setRentalDuration}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="cash-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Payment Amount"
            keyboardType="numeric"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="people-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Number of Guests"
            keyboardType="numeric"
            value={numberOfGuests}
            onChangeText={setNumberOfGuests}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-clear-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Check-in Date (YYYY-MM-DD)"
            value={checkInDate}
            onChangeText={setCheckInDate}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Check-out Date (YYYY-MM-DD)"
            value={checkOutDate}
            onChangeText={setCheckOutDate}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleBooking}>
            <Text style={styles.buttonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>

        <Dialog.Container visible={dialogVisible}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Dialog.Title style={styles.dialogTitle}>
              Are you sure?
            </Dialog.Title>
            <Dialog.Description style={styles.dialogDescription}>
              Are you sure you want to confirm your booking?
            </Dialog.Description>
            <View style={styles.buttonContainer}>
              <Dialog.Button
                label="Cancel"
                onPress={cancelBooking}
                style={styles.cancelButton}
              />
              <Dialog.Button
                label="Yes, confirm it!"
                onPress={confirmBooking}
                style={styles.confirmButton}
              />
            </View>
          </Animated.View>
        </Dialog.Container>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 60,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    backgroundColor: "#007BFF",
    padding: 5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    flex: 1,
    height: 50,
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  dialogDescription: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#007BFF",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#FF4D4D",
    color: "#FFFFFF",
  },
});

export default BookingPage;
