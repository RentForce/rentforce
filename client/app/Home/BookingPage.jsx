import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import Navbar from "./Navbar";

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
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [totalPayment, setTotalPayment] = useState("");

  useEffect(() => {
    if (rentalDuration && checkInDate) {
      const checkIn = new Date(checkInDate);
      if (isNaN(checkIn.getTime())) {
        setErrorMessages((prev) => ({
          ...prev,
          checkInDate: "Invalid date format. Use YYYY-MM-DD.",
        }));
        return;
      }
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + parseInt(rentalDuration));
      setCheckOutDate(checkOut.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }
  }, [rentalDuration, checkInDate]);

  const handleBooking = () => {
    const newErrorMessages = {};
    if (!name) newErrorMessages.name = "Please fill in your name.";
    if (!country) newErrorMessages.country = "Please select your country.";
    if (!rentalDuration)
      newErrorMessages.rentalDuration = "Please enter rental duration.";
    if (!paymentAmount)
      newErrorMessages.paymentAmount = "Please enter payment amount.";
    if (!numberOfGuests)
      newErrorMessages.numberOfGuests = "Please enter number of guests.";
    if (!checkInDate)
      newErrorMessages.checkInDate = "Please enter check-in date.";
    if (!checkOutDate)
      newErrorMessages.checkOutDate = "Please enter check-out date.";

    const checkIn = new Date(checkInDate);
    if (isNaN(checkIn.getTime())) {
      newErrorMessages.checkInDate = "Invalid date format. Use YYYY-MM-DD.";
    }

    if (Object.keys(newErrorMessages).length > 0) {
      setErrorMessages(newErrorMessages);
      return;
    }

    // Calculate total payment
    let calculatedPayment =
      parseFloat(paymentAmount) * parseInt(rentalDuration);
    if (parseInt(numberOfGuests) > 2) {
      calculatedPayment +=
        (parseInt(numberOfGuests) - 2) * parseFloat(paymentAmount);
    }

    setTotalPayment(calculatedPayment.toFixed(2));
    setDialogVisible(true);
    setErrorMessages({});
  };

  const handleDone = () => {
    setDialogVisible(false);
    setWelcomeVisible(true);
  };

  const resetForm = () => {
    setName("");
    setCountry("");
    setRentalDuration("");
    setPaymentAmount("");
    setNumberOfGuests("");
    setCheckInDate("");
    setCheckOutDate("");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Booking Information</Text>
          <TouchableOpacity
            style={styles.homeIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="home-outline" size={29} color="#007BFF" />
          </TouchableOpacity>
        </View>

        <Image
          source={{
            uri: "https://media.istockphoto.com/id/1129342452/photo/portrait-of-cheerful-young-manager-handshake-with-new-employee.jpg?s=612x612&w=0&k=20&c=fhrfMXr8-10DjuLocKLiny-1FgPumyjjzDYsG7epVi4=",
          }}
          style={styles.welcomeImage}
          resizeMode="cover"
        />

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
        {errorMessages.name && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.name}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons
            name="globe-outline"
            size={20}
            color="#007BFF"
            style={styles.icon}
          />
          <Picker
            selectedValue={country}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setCountry(itemValue);
            }}
          >
            <Picker.Item label="Select Your Country" value="" />
            <Picker.Item label="Albania" value="Albania" />
            <Picker.Item label="Algeria" value="Algeria" />
            <Picker.Item label="Andorra" value="Andorra" />
            <Picker.Item label="Angola" value="Angola" />
            <Picker.Item label="Argentina" value="Argentina" />
            <Picker.Item label="Armenia" value="Armenia" />
            <Picker.Item label="Australia" value="Australia" />
            <Picker.Item label="Austria" value="Austria" />
            <Picker.Item label="Azerbaijan" value="Azerbaijan" />
            <Picker.Item label="Bahamas" value="Bahamas" />
            <Picker.Item label="Bahrain" value="Bahrain" />
            <Picker.Item label="Bangladesh" value="Bangladesh" />
            <Picker.Item label="Barbados" value="Barbados" />
            <Picker.Item label="Belarus" value="Belarus" />
            <Picker.Item label="Belgium" value="Belgium" />
            <Picker.Item label="Belize" value="Belize" />
            <Picker.Item label="Benin" value="Benin" />
            <Picker.Item label="Bhutan" value="Bhutan" />
            <Picker.Item label="Bolivia" value="Bolivia" />
            <Picker.Item
              label="Bosnia and Herzegovina"
              value="Bosnia and Herzegovina"
            />
            <Picker.Item label="Botswana" value="Botswana" />
            <Picker.Item label="Brazil" value="Brazil" />
            <Picker.Item label="Brunei" value="Brunei" />
            <Picker.Item label="Bulgaria" value="Bulgaria" />
            <Picker.Item label="Burkina Faso" value="Burkina Faso" />
            <Picker.Item label="Burundi" value="Burundi" />
            <Picker.Item label="Cabo Verde" value="Cabo Verde" />
            <Picker.Item label="Cambodia" value="Cambodia" />
            <Picker.Item label="Cameroon" value="Cameroon" />
            <Picker.Item label="Canada" value="Canada" />
            <Picker.Item
              label="Central African Republic"
              value="Central African Republic"
            />
            <Picker.Item label="Chad" value="Chad" />
            <Picker.Item label="Chile" value="Chile" />
            <Picker.Item label="China" value="China" />
            <Picker.Item label="Colombia" value="Colombia" />
            <Picker.Item label="Comoros" value="Comoros" />
            <Picker.Item
              label="Congo, Democratic Republic of the"
              value="Congo, Democratic Republic of the"
            />
            <Picker.Item
              label="Congo, Republic of the"
              value="Congo, Republic of the"
            />
            <Picker.Item label="Costa Rica" value="Costa Rica" />
            <Picker.Item label="Croatia" value="Croatia" />
            <Picker.Item label="Cuba" value="Cuba" />
            <Picker.Item label="Cyprus" value="Cyprus" />
            <Picker.Item label="Czech Republic" value="Czech Republic" />
            <Picker.Item label="Denmark" value="Denmark" />
            <Picker.Item label="Djibouti" value="Djibouti" />
            <Picker.Item label="Dominica" value="Dominica" />
            <Picker.Item
              label="Dominican Republic"
              value="Dominican Republic"
            />
            <Picker.Item label="Ecuador" value="Ecuador" />
            <Picker.Item label="Egypt" value="Egypt" />
            <Picker.Item label="El Salvador" value="El Salvador" />
            <Picker.Item label="Equatorial Guinea" value="Equatorial Guinea" />
            <Picker.Item label="Eritrea" value="Eritrea" />
            <Picker.Item label="Estonia" value="Estonia" />
            <Picker.Item label="Eswatini" value="Eswatini" />
            <Picker.Item label="Ethiopia" value="Ethiopia" />
            <Picker.Item label="Fiji" value="Fiji" />
            <Picker.Item label="Finland" value="Finland" />
            <Picker.Item label="France" value="France" />
            <Picker.Item label="Gabon" value="Gabon" />
            <Picker.Item label="Gambia" value="Gambia" />
            <Picker.Item label="Georgia" value="Georgia" />
            <Picker.Item label="Germany" value="Germany" />
            <Picker.Item label="Ghana" value="Ghana" />
            <Picker.Item label="Greece" value="Greece" />
            <Picker.Item label="Grenada" value="Grenada" />
            <Picker.Item label="Guatemala" value="Guatemala" />
            <Picker.Item label="Guinea" value="Guinea" />
            <Picker.Item label="Guinea-Bissau" value="Guinea-Bissau" />
            <Picker.Item label="Guyana" value="Guyana" />
            <Picker.Item label="Haiti" value="Haiti" />
            <Picker.Item label="Honduras" value="Honduras" />
            <Picker.Item label="Hungary" value="Hungary" />
            <Picker.Item label="Iceland" value="Iceland" />
            <Picker.Item label="India" value="India" />
            <Picker.Item label="Indonesia" value="Indonesia" />
            <Picker.Item label="Iran" value="Iran" />
            <Picker.Item label="Iraq" value="Iraq" />
            <Picker.Item label="Ireland" value="Ireland" />
            <Picker.Item label="Israel" value="Israel" />
            <Picker.Item label="Italy" value="Italy" />
            <Picker.Item label="Jamaica" value="Jamaica" />
            <Picker.Item label="Japan" value="Japan" />
            <Picker.Item label="Jordan" value="Jordan" />
            <Picker.Item label="Kazakhstan" value="Kazakhstan" />
            <Picker.Item label="Kenya" value="Kenya" />
            <Picker.Item label="Kiribati" value="Kiribati" />
            <Picker.Item label="Kuwait" value="Kuwait" />
            <Picker.Item label="Kyrgyzstan" value="Kyrgyzstan" />
            <Picker.Item label="Laos" value="Laos" />
            <Picker.Item label="Latvia" value="Latvia" />
            <Picker.Item label="Lebanon" value="Lebanon" />
            <Picker.Item label="Lesotho" value="Lesotho" />
            <Picker.Item label="Liberia" value="Liberia" />
            <Picker.Item label="Libya" value="Libya" />
            <Picker.Item label="Liechtenstein" value="Liechtenstein" />
            <Picker.Item label="Lithuania" value="Lithuania" />
            <Picker.Item label="Luxembourg" value="Luxembourg" />
            <Picker.Item label="Madagascar" value="Madagascar" />
            <Picker.Item label="Malawi" value="Malawi" />
            <Picker.Item label="Malaysia" value="Malaysia" />
            <Picker.Item label="Maldives" value="Maldives" />
            <Picker.Item label="Mali" value="Mali" />
            <Picker.Item label="Malta" value="Malta" />
            <Picker.Item label="Marshall Islands" value="Marshall Islands" />
            <Picker.Item label="Mauritania" value="Mauritania" />
            <Picker.Item label="Mauritius" value="Mauritius" />
            <Picker.Item label="Mexico" value="Mexico" />
            <Picker.Item label="Micronesia" value="Micronesia" />
            <Picker.Item label="Moldova" value="Moldova" />
            <Picker.Item label="Monaco" value="Monaco" />
            <Picker.Item label="Mongolia" value="Mongolia" />
            <Picker.Item label="Montenegro" value="Montenegro" />
            <Picker.Item label="Morocco" value="Morocco" />
            <Picker.Item label="Mozambique" value="Mozambique" />
            <Picker.Item label="Myanmar" value="Myanmar" />
            <Picker.Item label="Namibia" value="Namibia" />
            <Picker.Item label="Nauru" value="Nauru" />
            <Picker.Item label="Nepal" value="Nepal" />
            <Picker.Item label="Netherlands" value="Netherlands" />
            <Picker.Item label="New Zealand" value="New Zealand" />
            <Picker.Item label="Nicaragua" value="Nicaragua" />
            <Picker.Item label="Niger" value="Niger" />
            <Picker.Item label="Nigeria" value="Nigeria" />
            <Picker.Item label="North Macedonia" value="North Macedonia" />
            <Picker.Item label="Norway" value="Norway" />
            <Picker.Item label="Oman" value="Oman" />
            <Picker.Item label="Pakistan" value="Pakistan" />
            <Picker.Item label="Palau" value="Palau" />
            <Picker.Item label="Palestine" value="Palestine" />
            <Picker.Item label="Panama" value="Panama" />
            <Picker.Item label="Papua New Guinea" value="Papua New Guinea" />
            <Picker.Item label="Paraguay" value="Paraguay" />
            <Picker.Item label="Peru" value="Peru" />
            <Picker.Item label="Philippines" value="Philippines" />
            <Picker.Item label="Poland" value="Poland" />
            <Picker.Item label="Portugal" value="Portugal" />
            <Picker.Item label="Qatar" value="Qatar" />
            <Picker.Item label="Romania" value="Romania" />
            <Picker.Item label="Russia" value="Russia" />
            <Picker.Item label="Rwanda" value="Rwanda" />
            <Picker.Item
              label="Saint Kitts and Nevis"
              value="Saint Kitts and Nevis"
            />
            <Picker.Item label="Saint Lucia" value="Saint Lucia" />
            <Picker.Item
              label="Saint Vincent and the Grenadines"
              value="Saint Vincent and the Grenadines"
            />
            <Picker.Item label="Samoa" value="Samoa" />
            <Picker.Item label="San Marino" value="San Marino" />
            <Picker.Item
              label="Sao Tome and Principe"
              value="Sao Tome and Principe"
            />
            <Picker.Item label="Saudi Arabia" value="Saudi Arabia" />
            <Picker.Item label="Senegal" value="Senegal" />
            <Picker.Item label="Serbia" value="Serbia" />
            <Picker.Item label="Seychelles" value="Seychelles" />
            <Picker.Item label="Sierra Leone" value="Sierra Leone" />
            <Picker.Item label="Singapore" value="Singapore" />
            <Picker.Item label="Slovakia" value="Slovakia" />
            <Picker.Item label="Slovenia" value="Slovenia" />
            <Picker.Item label="Solomon Islands" value="Solomon Islands" />
            <Picker.Item label="Somalia" value="Somalia" />
            <Picker.Item label="South Africa" value="South Africa" />
            <Picker.Item label="South Korea" value="South Korea" />
            <Picker.Item label="South Sudan" value="South Sudan" />
            <Picker.Item label="Spain" value="Spain" />
            <Picker.Item label="Sri Lanka" value="Sri Lanka" />
            <Picker.Item label="Sudan" value="Sudan" />
            <Picker.Item label="Suriname" value="Suriname" />
            <Picker.Item label="Sweden" value="Sweden" />
            <Picker.Item label="Switzerland" value="Switzerland" />
            <Picker.Item label="Syria" value="Syria" />
            <Picker.Item label="Tajikistan" value="Tajikistan" />
            <Picker.Item label="Tanzania" value="Tanzania" />
            <Picker.Item label="Thailand" value="Thailand" />
            <Picker.Item label="Togo" value="Togo" />
            <Picker.Item label="Tonga" value="Tonga" />
            <Picker.Item
              label="Trinidad and Tobago"
              value="Trinidad and Tobago"
            />
            <Picker.Item label="Tunisia" value="Tunisia" />
            <Picker.Item label="Turkey" value="Turkey" />
            <Picker.Item label="Turkmenistan" value="Turkmenistan" />
            <Picker.Item label="Tuvalu" value="Tuvalu" />
            <Picker.Item label="Uganda" value="Uganda" />
            <Picker.Item label="Ukraine" value="Ukraine" />
            <Picker.Item
              label="United Arab Emirates"
              value="United Arab Emirates"
            />
            <Picker.Item label="United Kingdom" value="United Kingdom" />
            <Picker.Item label="United States" value="United States" />
            <Picker.Item label="Uruguay" value="Uruguay" />
            <Picker.Item label="Uzbekistan" value="Uzbekistan" />
            <Picker.Item label="Vanuatu" value="Vanuatu" />
            <Picker.Item label="Vatican City" value="Vatican City" />
            <Picker.Item label="Venezuela" value="Venezuela" />
            <Picker.Item label="Vietnam" value="Vietnam" />
            <Picker.Item label="Yemen" value="Yemen" />
            <Picker.Item label="Zambia" value="Zambia" />
            <Picker.Item label="Zimbabwe" value="Zimbabwe" />
          </Picker>
        </View>
        {errorMessages.country && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.country}</Text>
          </View>
        )}

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
        {errorMessages.rentalDuration && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.rentalDuration}</Text>
          </View>
        )}

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
        {errorMessages.paymentAmount && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.paymentAmount}</Text>
          </View>
        )}

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
        {errorMessages.numberOfGuests && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.numberOfGuests}</Text>
          </View>
        )}

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
        {errorMessages.checkInDate && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.checkInDate}</Text>
          </View>
        )}

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
            editable={false} // Make it read-only
          />
        </View>
        {errorMessages.checkOutDate && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="red" />
            <Text style={styles.errorText}>{errorMessages.checkOutDate}</Text>
          </View>
        )}

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleBooking}>
            <AntDesign name="customerservice" size={24} color="white" />
            <Text style={styles.buttonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent={true} visible={dialogVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQirRUZNCaKj6UU3G8U7ktKbUGB2eQwUzS1kWwcgUa5auvK8Ap3_x2PNhfWrzhHfSIouZQ&usqp=CAU",
                }} // Replace with your confirmation image URL
                style={styles.confirmationImage}
              />
              <Ionicons name="checkmark-circle" size={50} color="green" />
              <Text style={styles.modalTitle}>Thank You!</Text>
              <Text style={styles.modalMessage}>
                Your request will only be under review for approval once you
                click 'Done'.{" "}
              </Text>
              <Text style={styles.modalPayment}>
                Total Payment: ${totalPayment}
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>DONE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDialogVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={welcomeVisible}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: "https://c4.wallpaperflare.com/wallpaper/417/817/200/kung-fu-panda-animated-movies-movies-wallpaper-preview.jpg",
                }} // Replace with your thank you image URL
                style={styles.thankYouImage}
                resizeMode="contain" // Adjust the image size
              />
              <Text style={styles.welcomeTitle}>You're Welcome!</Text>
              <Text style={styles.welcomeMessage}>
                Thank you, {name}, for your booking!
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  setWelcomeVisible(false);
                  resetForm();
                }}
              >
                <AntDesign
                  name="checkcircle"
                  size={24}
                  color="white"
                  style={styles.icon}
                />
                <Text style={styles.doneButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Navbar navigation={navigation} />
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
    flexDirection: "row", // Arrange buttons in a row
    justifyContent: "space-between", // Space between buttons
    marginTop: 20, // Add some margin above the buttons
    width: "100%", // Ensure the container takes full width
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    height: 100,
    marginBottom: 10,
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
    marginBottom: 15,
    marginLeft: 13,
    marginTop: -1,
  },
  errorText: {
    color: "blue",
    fontSize: 11,
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 20,
    textAlign: "center",
    padding: 17,
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
  },
  welcomeImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmationImage: {
    width: 100, // Adjust size as needed
    height: 100, // Adjust size as needed
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#007BFF", // Title color
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: "center",
  },
  modalPayment: {
    fontSize: 16,
    marginVertical: 5,
    color: "#007BFF", // Payment amount color
  },
  doneButton: {
    flexDirection: "row", // Arrange icon and text in a row
    alignItems: "center", // Center the icon and text vertically
    backgroundColor: "#007BFF", // Button background color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20, // Space above the button
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10, // Space between icon and text
  },
  cancelButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1, // Allow the button to grow
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center", // Center text
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    color: "green",
  },
  welcomeMessage: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: "center",
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  homeIcon: {
    position: "absolute",
    right: 20,
    top: 10,
  },
  confirmButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#007BFF", // Background color for the container
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Elevation for Android
  },
  button: {
    flexDirection: "row", // Arrange icon and text in a row
    alignItems: "center", // Center the icon and text vertically
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#007BFF", // Button background color
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10, // Space between icon and text
  },
  thankYouImage: {
    width: "100%", // Full width of the modal
    height: 150, // Adjust height as needed
    marginBottom: 20, // Space below the image
    borderRadius: 10, // Optional: rounded corners
  },
});

export default BookingPage;
