import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import * as Animatable from "react-native-animatable";
import Navbar from "./Navbar";
import axios from "axios";


// Define getDatesInRange helper function OUTSIDE the component
const getDatesInRange = (startDate, endDate) => {
  const dates = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateString = date.toISOString().split("T")[0];

    if (dateString === startDate) {
      dates[dateString] = {
        selected: true,
        startingDay: true,
        color: "#2D5A27",
      };
    } else if (dateString === endDate) {
      dates[dateString] = {
        selected: true,
        endingDay: true,
        color: "#2D5A27",
      };
    } else {
      dates[dateString] = {
        selected: true,
        color: "#E8F3E9",
        textColor: "#2D5A27",
      };
    }
  }
  return dates;
};

const BookingPage = ({ navigation, route }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL

  const { post } = route.params || {};
  const initialPaymentAmount = post && post.price ? post.price.toString() : "0";

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    paymentAmount: initialPaymentAmount,
    numberOfGuests: "",
    dateRange: { startDate: "", endDate: "" },
    rentalDuration: 0,
    totalPayment: 0,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});
  const [bookingStatus, setBookingStatus] = useState({
    isLoading: false,
    error: null,
    bookingId: null,
    status: null,
  });

  const [bookedDates, setBookedDates] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/posts/${post.id}/booked-dates`
        );

        console.log("Booked dates response:", response.data);

        const bookedDatesObj = {};

        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((booking) => {
            if (booking.postId === post.id) {
              const start = new Date(booking.startDate);
              const end = new Date(booking.endDate);

              for (
                let date = new Date(start);
                date <= end;
                date.setDate(date.getDate() + 1)
              ) {
                const dateString = date.toISOString().split("T")[0];
                bookedDatesObj[dateString] = {
                  disabled: true,
                  disableTouchEvent: true,
                  textColor: "#BBBBBB",
                  selectedColor: "#F0F0F0",
                  marked: true,
                  dotColor: "#FF6B6B",
                  customStyles: {
                    text: {
                      textDecorationLine: "line-through",
                      textDecorationColor: "#FF6B6B",
                    },
                  },
                };
              }
            }
          });
        }

        setBookedDates(bookedDatesObj);
      } catch (error) {
        console.error(
          `Error fetching booked dates for post ${post.id}:`,
          error
        );
        if (error.response) {
          console.error("Error response:", error.response.data);
        }
      }
    };

    if (post?.id) {
      fetchBookedDates();
    }
  }, [post?.id]);

  const calculateTotalCost = useCallback(() => {
    const paymentAmount = parseFloat(formData.paymentAmount);
    const guests = parseInt(formData.numberOfGuests) || 0;
    const duration = formData.rentalDuration || 0;
    return isNaN(paymentAmount) ? 0 : paymentAmount * guests * duration;
  }, [
    formData.paymentAmount,
    formData.numberOfGuests,
    formData.rentalDuration,
  ]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.country) errors.country = "Country is required";
    if (!formData.numberOfGuests)
      errors.guests = "Number of guests is required";
    if (!formData.dateRange.startDate || !formData.dateRange.endDate) {
      errors.dates = "Please select both check-in and check-out dates";
    }
    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDateRangeChange = (day) => {
    const selectedDate = day.dateString;
    const { startDate, endDate } = formData.dateRange;

    if (!startDate || (startDate && endDate)) {
      setFormData((prev) => ({
        ...prev,
        dateRange: { startDate: selectedDate, endDate: "" },
        rentalDuration: 0,
      }));
    } else {
      const start = new Date(startDate);
      const end = new Date(selectedDate);
      if (end < start) {
        Alert.alert(
          "Invalid Date Range",
          "Check-out date must be after check-in date"
        );
        return;
      }
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({
        ...prev,
        dateRange: { ...prev.dateRange, endDate: selectedDate },
        rentalDuration: duration,
      }));
    }
  };

  const handleBookingConfirm = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const submitBooking = async () => {
    try {
      setIsLoading(true);
      const totalCost = calculateTotalCost();

      // First create the booking
      const bookingData = {
        userId: 1, // Replace with actual user ID
        postId: post.id,
        startDate: formData.dateRange.startDate,
        endDate: formData.dateRange.endDate,
        totalPrice: totalCost,
        numberOfGuests: parseInt(formData.numberOfGuests),
      };

      const bookingResponse = await axios.post(
        `${apiUrl}/posts/booking`,
        bookingData
      );

      if (bookingResponse.status === 201) {
        // Send email notification
        const emailData = {
          guestEmail: "yassine2904@gmail.com", // Replace with actual guest email
          hostEmail: "mejrisaif2020@gmail.com", // Replace with actual host email
          houseDetails: {
            title: post.title,
            location: post.location,
            checkIn: formData.dateRange.startDate,
            checkOut: formData.dateRange.endDate,
            guests: formData.numberOfGuests
          },
          price: totalCost
        };

        await axios.post(`${apiUrl}/confirm-booking`, emailData);

        setShowConfirmModal(false);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Booking Error:", error);
      Alert.alert(
        "Booking Error",
        error.response?.data?.message || "Failed to confirm booking"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessModal = () => (
    <Modal visible={showSuccessModal} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <Animatable.View
          animation="zoomIn"
          duration={500}
          style={styles.modalContent}
        >
          <Animatable.View
            animation="bounceIn"
            delay={500}
            style={styles.iconContainer}
          >
            <AntDesign name="checkcircle" size={60} color="#2D5A27" />
          </Animatable.View>

          <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmationText}>
            Your booking has been successfully confirmed. Your request to book has been send successfully, we will send you an update soon.
          </Text>

          <View style={styles.bookingSummary}>
            <Text style={styles.summaryTitle}>Booking Details</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Check-in:</Text>
              <Text style={styles.summaryValue}>
                {new Date(formData.dateRange.startDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Check-out:</Text>
              <Text style={styles.summaryValue}>
                {new Date(formData.dateRange.endDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Guests:</Text>
              <Text style={styles.summaryValue}>{formData.numberOfGuests}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>
                ${calculateTotalCost().toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.navigate("Home");
            }}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );

  const ConfirmationModal = () => (
    <Modal visible={showConfirmModal} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirm Booking</Text>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-in:</Text>
              <Text style={styles.detailValue}>
                {new Date(formData.dateRange.startDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-out:</Text>
              <Text style={styles.detailValue}>
                {new Date(formData.dateRange.endDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Guests:</Text>
              <Text style={styles.detailValue}>{formData.numberOfGuests}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {formData.rentalDuration}{" "}
                {formData.rentalDuration === 1 ? "night" : "nights"}
              </Text>
            </View>

            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>
                ${calculateTotalCost().toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={submitBooking}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Property Preview */}
        {post?.images && post.images.length > 0 && (
          <View style={styles.propertyPreview}>
            <Image
              source={{ uri: post.images[0].url }}
              style={styles.propertyImage}
            />
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyPrice}>${post.price}/night</Text>
              <Text style={styles.propertyLocation}>{post.location}</Text>
            </View>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#1A3C40"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
              />
            </View>
            {errorMessages.name && (
              <Text style={styles.errorText}>{errorMessages.name}</Text>
            )}
          </View>

          {/* Country Picker */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Country</Text>
            <View style={styles.pickerContainer}>
              <Ionicons
                name="globe-outline"
                size={20}
                color="#1A3C40"
                style={styles.icon}
              />
              <Picker
                selectedValue={formData.country}
                style={styles.picker}
                onValueChange={(itemValue) =>
                  setFormData((prev) => ({ ...prev, country: itemValue }))
                }
              >
                <Picker.Item
                  label="   Select Your Country"
                  value=""
                  style={styles.pickerPlaceholder}
                />
                <Picker.Item label="Afghanistan" value="Afghanistan" />
                <Picker.Item label="Albania" value="Albania" />
                <Picker.Item label="Algeria" value="Algeria" />
                <Picker.Item label="Andorra" value="Andorra" />
                <Picker.Item label="Angola" value="Angola" />
                <Picker.Item
                  label="Antigua and Barbuda"
                  value="Antigua and Barbuda"
                />
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
                <Picker.Item
                  label="Equatorial Guinea"
                  value="Equatorial Guinea"
                />
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
                <Picker.Item
                  label="Marshall Islands"
                  value="Marshall Islands"
                />
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
                <Picker.Item label="Panama" value="Panama" />
                <Picker.Item
                  label="Papua New Guinea"
                  value="Papua New Guinea"
                />
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
                <Picker.Item label="Taiwan" value="Taiwan" />
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
              <Text style={styles.errorText}>{errorMessages.country}</Text>
            )}
          </View>

          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>Select Dates</Text>
            <Calendar
              style={styles.calendar}
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#1A1A1A",
                selectedDayBackgroundColor: "#2D5A27",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#2D5A27",
                dayTextColor: "#1A1A1A",
                textDisabledColor: "#CCCCCC",
                dotColor: "#2D5A27",
                selectedDotColor: "#FFFFFF",
                arrowColor: "#2D5A27",
                monthTextColor: "#1A1A1A",
                textMonthFontWeight: "700",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
                textDayFontWeight: "500",
                textDayHeaderFontWeight: "600",
                "stylesheet.calendar.header": {
                  header: {
                    backgroundColor: "#FFFFFF",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginTop: 8,
                    alignItems: "center",
                  },
                },
              }}
              onDayPress={handleDateRangeChange}
              markedDates={{
                ...bookedDates,
                ...(formData.dateRange.startDate && formData.dateRange.endDate
                  ? getDatesInRange(
                      formData.dateRange.startDate,
                      formData.dateRange.endDate
                    )
                  : formData.dateRange.startDate
                  ? {
                      [formData.dateRange.startDate]: {
                        selected: true,
                        startingDay: true,
                        color: "#2D5A27",
                      },
                    }
                  : {}),

                // Add grey background for booked dates
                ...Object.keys(bookedDates).reduce((acc, date) => {
                  acc[date] = {
                    disabled: true,
                    disableTouchEvent: true,
                    textColor: "#BBBBBB",
                    selectedColor: "#D3D3D3", // Grey background for booked dates
                    marked: true,
                    dotColor: "#FF6B6B",
                    customStyles: {
                      text: {
                        textDecorationLine: "line-through",
                        textDecorationColor: "#FF6B6B",
                      },
                    },
                  };
                  return acc;
                }, {}),
              }}
              markingType={"period"}
              disableAllTouchEventsForDisabledDays={true}
            />
            {errorMessages.dates && (
              <Text style={styles.errorText}>{errorMessages.dates}</Text>
            )}
          </View>

          {/* Guest Count & Payment */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputWrapper, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Guests</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color="#1A3C40"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Guests"
                  keyboardType="numeric"
                  value={formData.numberOfGuests}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, numberOfGuests: text }))
                  }
                />
              </View>
              {errorMessages.guests && (
                <Text style={styles.errorText}>{errorMessages.guests}</Text>
              )}
            </View>

            <View style={[styles.inputWrapper, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Price per Night</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color="#1A3C40"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.paymentAmount}
                  editable={false}
                />
              </View>
            </View>
          </View>

          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>
                {formData.rentalDuration}{" "}
                {formData.rentalDuration === 1 ? "night" : "nights"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests:</Text>
              <Text style={styles.summaryValue}>{formData.numberOfGuests}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryValue}>
                ${calculateTotalCost().toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleBookingConfirm}
          >
            <Text style={styles.submitButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal />
      <SuccessModal />
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1EFEF",
  },
  scrollViewContent: {
    paddingBottom: 30,
    paddingHorizontal: 15,
  },
  propertyPreview: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  propertyImage: {
    width: "100%",
    height: 220,
    borderBottomWidth: 2,
    borderBottomColor: "#E8E8E8",
  },
  propertyDetails: {
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#08232C",
  },
  propertyLocation: {
    fontSize: 18,
    color: "#08232C",
    marginTop: 5,
  },
  formContainer: {
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 20,
    flexDirection: "column",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#08232C",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    height: 50,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
    position: "absolute",
    left: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 40,
    fontSize: 16,
    height: "100%",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    height: 70,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    flex: 1,
    marginRight: -11,
    height: "100%",
    color: "#08232C",
    fontSize: 16,
    paddingLeft: 40,
  },
  pickerPlaceholder: {
    alignItems: "center",
    fontSize: 16,
    color: "#999",
  },
  calendarSection: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#08232C",
    marginBottom: 10,
  },
  calendar: {
    borderRadius: 10,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  submitButton: {
    backgroundColor: "#2C3E50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#88a884",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A3C40",
    textAlign: "center",
    marginBottom: 20,
  },
  bookingDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F3E9",
  },
  detailLabel: {
    fontSize: 16,
    color: "#08232C",
  },
  detailValue: {
    fontSize: 16,
    color: "#08232C",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#2D5A27",
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A3C40",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5A27",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2D5A27",
  },
  confirmButton: {
    backgroundColor: "#2D5A27",
  },
  cancelButtonText: {
    color: "#2D5A27",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#08232C",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 16,
    color: "#08232C",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  bookingSummary: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#08232C",
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#08232C",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A3C40",
  },
  doneButton: {
    backgroundColor: "#2D5A27",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 5,
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
});

export default BookingPage;