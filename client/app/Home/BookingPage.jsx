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
          `http://192.168.255.93:5000/posts/${post.id}/booked-dates`
        );

        console.log("Booked dates response:", response.data);

        const bookedDatesObj = {};

        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((booking) => {
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
          });
        } else {
          console.log("Invalid response data format:", response.data);
        }

        setBookedDates(bookedDatesObj);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
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

      const bookingData = {
        userId: 1, // Replace with actual user ID
        postId: post.id,
        startDate: formData.dateRange.startDate,
        endDate: formData.dateRange.endDate,
        totalPrice: totalCost,
        numberOfGuests: parseInt(formData.numberOfGuests),
      };

      const response = await axios.post(
        "http://192.168.255.93:5000/posts/booking",
        bookingData
      );

      if (response.status === 201) {
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
            Your booking has been successfully confirmed. We've sent you a
            confirmation email with all the details.
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
                <Picker.Item label="Select Your Country" value="" />
                <Picker.Item label="United States" value="United States" />
                {/* Add more countries */}
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
                calendarBackground: "#fff",
                textSectionTitleColor: "#1A3C40",
                selectedDayBackgroundColor: "#2D5A27",
                selectedDayTextColor: "#fff",
                todayTextColor: "#2D5A27",
                dayTextColor: "#2d4150",
                textDisabledColor: "#BBBBBB",
                dotColor: "#2D5A27",
                selectedDotColor: "#ffffff",
                arrowColor: "#1A3C40",
                monthTextColor: "#1A3C40",
                textMonthFontWeight: "bold",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
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
                  placeholder="Number of guests"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  propertyPreview: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: "100%",
    height: 200,
  },
  propertyDetails: {
    padding: 15,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A3C40",
  },
  propertyLocation: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  formContainer: {
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A3C40",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  picker: {
    flex: 1,
    height: 50,
  },
  calendarSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A3C40",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#2D5A27",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
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
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    color: "#1A3C40",
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
    color: "#1A3C40",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 16,
    color: "#666",
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
    color: "#1A3C40",
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
    color: "#495057",
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
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 5,
  },
});

export default BookingPage;
