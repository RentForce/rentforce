import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import Dialog from "react-native-dialog";

const BookingPage = ({ navigation }) => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [rentalDuration, setRentalDuration] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [errorMessages, setErrorMessages] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [totalPayment, setTotalPayment] = useState("");

  useEffect(() => {
    if (rentalDuration && checkInDate) {
      const checkIn = new Date(checkInDate);
      if (isNaN(checkIn.getTime())) {
        setErrorMessages((prev) => ({ ...prev, checkInDate: "Invalid date format. Use YYYY-MM-DD." }));
        return;
      }
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + parseInt(rentalDuration));
      setCheckOutDate(checkOut.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  }, [rentalDuration, checkInDate]);

  const handleBooking = () => {
    const newErrorMessages = {};
    if (!name) newErrorMessages.name = "Please fill in your name.";
    if (!country) newErrorMessages.country = "Please select your country.";
    if (!rentalDuration) newErrorMessages.rentalDuration = "Please enter rental duration.";
    if (!paymentAmount) newErrorMessages.paymentAmount = "Please enter payment amount.";
    if (!numberOfGuests) newErrorMessages.numberOfGuests = "Please enter number of guests.";
    if (!checkInDate) newErrorMessages.checkInDate = "Please enter check-in date.";
    if (!checkOutDate) newErrorMessages.checkOutDate = "Please enter check-out date.";

    const checkIn = new Date(checkInDate);
    if (isNaN(checkIn.getTime())) {
      newErrorMessages.checkInDate = "Invalid date format. Use YYYY-MM-DD.";
    }

    if (Object.keys(newErrorMessages).length > 0) {
      setErrorMessages(newErrorMessages);
      return;
    }

    // Calculate total payment
    let calculatedPayment = parseFloat(paymentAmount) * parseInt(rentalDuration);
    if (parseInt(numberOfGuests) > 2) {
      calculatedPayment += (parseInt(numberOfGuests) - 2) * parseFloat(paymentAmount);
    }

    setTotalPayment(calculatedPayment.toFixed(2));
    setDialogVisible(true);
    setErrorMessages({});
  };

  const handleDialogConfirm = () => {
    setDialogVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Booking Information</Text>

        <Image
          source={{ uri: 'https://media.istockphoto.com/id/1129342452/photo/portrait-of-cheerful-young-manager-handshake-with-new-employee.jpg?s=612x612&w=0&k=20&c=fhrfMXr8-10DjuLocKLiny-1FgPumyjjzDYsG7epVi4=' }}
          style={styles.welcomeImage}
          resizeMode="cover"
        />

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
          />
        </View>
        {errorMessages.name && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.name}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="globe-outline" size={20} color="#007BFF" style={styles.icon} />
          <Picker
            selectedValue={country}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setCountry(itemValue);
              setErrorMessages((prev) => ({ ...prev, country: "" }));
            }}
          >
            <Picker.Item label="Select Your Country" value="" />
            <Picker.Item label="Egypt" value="Egypt" />
            <Picker.Item label="Saudi Arabia" value="Saudi Arabia" />
            <Picker.Item label="United Arab Emirates" value="United Arab Emirates" />
            {/* Add more countries as needed */}
          </Picker>
        </View>
        {errorMessages.country && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.country}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Rental Duration (days)"
            keyboardType="numeric"
            value={rentalDuration}
            onChangeText={setRentalDuration}
          />
        </View>
        {errorMessages.rentalDuration && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.rentalDuration}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="cash-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Payment Amount"
            keyboardType="numeric"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
          />
        </View>
        {errorMessages.paymentAmount && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.paymentAmount}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="people-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Number of Guests"
            keyboardType="numeric"
            value={numberOfGuests}
            onChangeText={setNumberOfGuests}
          />
        </View>
        {errorMessages.numberOfGuests && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.numberOfGuests}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-clear-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Check-in Date (YYYY-MM-DD)"
            value={checkInDate}
            onChangeText={setCheckInDate}
          />
        </View>
        {errorMessages.checkInDate && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.checkInDate}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#007BFF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Check-out Date (YYYY-MM-DD)"
            value={checkOutDate}
            editable={false} // Make it read-only
          />
        </View>
        {errorMessages.checkOutDate && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.checkOutDate}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleBooking}>
            <Text style={styles.buttonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Booking Confirmed</Dialog.Title>
        <Dialog.Description>
          Total Payment: ${totalPayment}
          {"\n"}Check-in: {checkInDate}
          {"\n"}Check-out: {checkOutDate}
        </Dialog.Description>
        <Dialog.Button label="OK" onPress={handleDialogConfirm} />
      </Dialog.Container>
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  icon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 14,
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 20,
    textAlign: "center",
    padding: 10,
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
  },
  welcomeImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
});

export default BookingPage;
