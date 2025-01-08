import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import Navbar from "./Navbar";
import ImageZoom from "react-native-image-pan-zoom";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import {
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const COMMENTS_PREVIEW_COUNT = 1;

const HomeDetails = ({ route, navigation }) => {
  const { post } = route.params;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showMoreRules, setShowMoreRules] = useState(false);
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [userCanComment, setUserCanComment] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    spam: false,
    offensive: false,
    scam: false,
    incorrect: false,
  });
  const [userCanReport, setUserCanReport] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState({
    title: "",
    description: "",
    icon: "",
  });

  const refreshUserToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      console.log("Refresh token found:", !!refreshToken);
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Attempting to refresh token...");
      const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
        refreshToken: refreshToken
      });

      console.log("Refresh response:", response.data);

      if (response.data?.token) {
        await AsyncStorage.setItem("userToken", response.data.token);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
        }
        return response.data.token;
      } else {
        throw new Error("No token in refresh response");
      }
    } catch (error) {
      console.error("Token refresh failed:", error.response?.data || error.message);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch comments with error handling
        const commentsResponse = await axios.get(
          `${apiUrl}/posts/${post.id}/comments`
        ).catch(err => {
          console.warn("Comments fetch failed:", err);
          return { data: [] }; // Provide fallback data
        });
        setComments(commentsResponse.data);

        // Fetch images with error handling
        const imagesResponse = await axios.get(
          `${apiUrl}/posts/images/${post.id}`
        ).catch(err => {
          console.warn("Images fetch failed:", err);
          return { data: [] }; // Provide fallback data
        });
        setImages(imagesResponse.data);

        // Check user booking status with error handling
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          try {
            const decodedToken = JSON.parse(atob(token.split(".")[1]));
            const userId = decodedToken.id;

            const bookingResponse = await axios.get(
              `${apiUrl}/posts/${post.id}/check-booking/${userId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            setUserCanComment(bookingResponse.data.hasBooked);
            setUserCanReport(bookingResponse.data.hasBooked);
          } catch (err) {
            console.warn("Booking check failed:", err);
            setUserCanComment(false);
            setUserCanReport(false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    if (post?.id) {
      fetchData();
    }
  }, [post?.id]);

  useEffect(() => {
    console.log("showAllComments state:", showAllComments);
    console.log("Current comments:", comments);
  }, [showAllComments, comments]);

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const handleConfirmBooking = () => {
    navigation.navigate("Booking", { post });
  };

  const handleSeeMorePress = () => {
    console.log("See more button pressed");
    setShowAllComments(true);
  };

  const handleAddComment = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        return;
      }

      const response = await axios.post(
        `${apiUrl}/posts/${post.id}/comments`,
        {
          content: newComment,
          rating: rating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        setComments((prevComments) => [response.data, ...prevComments]);
        setNewComment("");
        setRating(0);
        setShowCommentModal(false);
        setShowAllComments(true);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleReport = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      // Check if user has booked before reporting
      if (!userCanReport) {
        Alert.alert(
          "Cannot Report",
          "You can only report properties you have previously booked.",
          [{ text: "OK" }]
        );
        return;
      }

      // Check if at least one reason is selected
      const hasSelectedReason = Object.values(reportReasons).some(
        (value) => value
      );
      if (!hasSelectedReason) {
        Alert.alert("Error", "Please select at least one reason for reporting");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/reports`,
        {
          postId: post.id,
          reasons: reportReasons,
          details: reportText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Report Submitted",
          "Thank you for your report. We will review it shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowReportModal(false);
                setReportText("");
                setReportReasons({
                  inappropriate: false,
                  spam: false,
                  offensive: false,
                  scam: false,
                  incorrect: false,
                });
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to submit report. Please try again later."
      );
    }
  };

  const handleChatWithReceiver = async (receiverId, receiverDetails) => {
    try {
      console.log("Starting chat with receiver:", receiverId);
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        navigation.navigate("signup");
        return;
      }

      // Validate token structure
      let decodedToken;
      try {
        decodedToken = JSON.parse(atob(token.split(".")[1]));
        console.log("Token decoded successfully, user ID:", decodedToken.id);
      } catch (error) {
        console.error("Token decode failed:", error);
        await AsyncStorage.multiRemove(["userToken", "refreshToken", "userId", "currentUser"]);
        navigation.reset({
          index: 0,
          routes: [{ name: "signup" }],
        });
        return;
      }

      if (decodedToken.id === receiverId) {
        Alert.alert("Error", "You cannot chat with yourself");
        return;
      }

      // First try to get existing chat
      let chatId;
      try {
        console.log("Checking for existing chat...");
        const existingChatResponse = await axios.get(
          `${apiUrl}/api/chat/find/${decodedToken.id}/${receiverId}`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          }
        );

        console.log("Existing chat response:", existingChatResponse.data);
        
        if (existingChatResponse.data?.id) {
          chatId = existingChatResponse.data.id;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          throw error; // Let the outer catch block handle the 401
        }
        console.log("No existing chat found, will create new one");
      }

      // If no existing chat was found, create new one
      if (!chatId) {
        console.log("Creating new chat...");
        const createResponse = await axios.post(
          `${apiUrl}/api/chat/create`,
          {
            userId: decodedToken.id,
            receiverId: receiverId,
          },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          }
        );

        console.log("Create chat response:", createResponse.data);

        if (!createResponse.data?.id) {
          throw new Error("Failed to create chat");
        }
        chatId = createResponse.data.id;
      }

      console.log("Navigating to chat:", chatId);
      navigateToChat(chatId, receiverId, receiverDetails);

    } catch (error) {
      console.error("Error in handleChatWithReceiver:", error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(["userToken", "refreshToken", "userId", "currentUser"]);
        Alert.alert(
          "Session Expired",
          "Please log in again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "signup" }],
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to start chat. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  // Helper function to handle navigation
  const navigateToChat = (chatId, receiverId, receiverDetails) => {
    const otherUser = {
      id: receiverId,
      firstName: receiverDetails?.firstName || "Property Owner",
      lastName: receiverDetails?.lastName || "",
      image: receiverDetails?.image || "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png",
    };

    navigation.navigate("ChatScreen", {
      chatId: chatId,
      otherUser,
      receiverId: receiverId,
    });
  };

  const ImageModal = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = new Animated.Value(0);

    const handleScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      {
        useNativeDriver: false,
        listener: (event) => {
          const slideSize = SCREEN_WIDTH;
          const index = Math.round(
            event.nativeEvent.contentOffset.x / slideSize
          );
          setCurrentIndex(index);
        },
      }
    );

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            bounces={false}
            style={styles.fullWidthScrollView}
            contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.fullWidthSlideContainer}>
                {image && image.url ? (
                  <ImageZoom
                    cropWidth={SCREEN_WIDTH}
                    cropHeight={SCREEN_HEIGHT}
                    imageWidth={SCREEN_WIDTH}
                    imageHeight={SCREEN_HEIGHT * 0.8}
                    panToMove={true}
                    pinchToZoom={true}
                    enableSwipeDown={true}
                    swipeDownThreshold={50}
                    minScale={1}
                    maxScale={4}
                    useNativeDriver={true}
                  >
                    <TouchableWithoutFeedback onPress={() => {}}>
                      <Image
                        source={{ uri: image.url }}
                        style={styles.fullWidthImage}
                        resizeMode="contain"
                      />
                    </TouchableWithoutFeedback>
                  </ImageZoom>
                ) : (
                  <Text style={styles.errorText}>Image not available</Text>
                )}
              </View>
            ))}
          </Animated.ScrollView>

          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>

          <View style={styles.pagination}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, currentIndex === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>
      </Modal>
    );
  };

  // Add this helper function to determine icons based on rule content
  const getRuleIcon = (rule) => {
    const ruleLower = rule.toLowerCase();
    if (ruleLower.includes("smoke") || ruleLower.includes("smoking"))
      return "smoke-free";
    if (ruleLower.includes("pet")) return "pets";
    if (ruleLower.includes("part")) return "celebration";
    if (ruleLower.includes("check")) return "schedule";
    if (ruleLower.includes("clean")) return "cleaning-services";
    if (ruleLower.includes("quiet") || ruleLower.includes("noise"))
      return "volume-off";
    return "check-circle"; // default icon
  };

  // Add this helper function for safety icons
  const getSafetyIcon = (safety) => {
    const safetyLower = safety.toLowerCase();
    if (safetyLower.includes("fire") || safetyLower.includes("smoke"))
      return "fire-extinguisher";
    if (safetyLower.includes("camera")) return "security";
    if (safetyLower.includes("aid") || safetyLower.includes("medical"))
      return "medical-services";
    if (safetyLower.includes("lock") || safetyLower.includes("secure"))
      return "lock";
    if (safetyLower.includes("emergency")) return "emergency";
    if (safetyLower.includes("alarm")) return "alarm";
    return "verified-user"; // default safety icon
  };

  // Add this helper function to get detailed descriptions
  const getDetailedDescription = (type, item) => {
    const descriptions = {
      room: {
        beds: "Comfortable beds with fresh linens provided. Each bed includes premium pillows, cozy blankets, and high-quality mattresses for a restful sleep. Fresh sheets are changed between each guest stay.",
        baths:
          "Modern bathroom facilities equipped with a rainfall shower, clean towels, toilet, and complimentary toiletries. Includes hair dryer, well-lit mirrors, and ample counter space.",
        garages:
          "Secure, covered parking space with automatic door and remote control. Features good lighting, security cameras, and easy access to the main property.",
        rooms:
          "Spacious, well-furnished rooms with natural lighting, climate control, and comfortable seating. Each room includes storage space and basic amenities.",
        kitchen:
          "Fully equipped kitchen with modern appliances, including refrigerator, stove, microwave, and dishwasher. Stocked with cookware, utensils, and basic cooking supplies.",
        "living room":
          "Comfortable living space with quality furniture, entertainment system, and plenty of seating. Perfect for relaxation and socializing.",
        bedroom:
          "Cozy bedroom featuring a comfortable bed, fresh linens, bedside tables with reading lamps, and ample closet space. Includes blackout curtains for optimal sleep.",
        "dining room":
          "Elegant dining area with a spacious table and comfortable seating. Perfect for enjoying meals together. Features ambient lighting and place settings.",
        balcony:
          "Private balcony with outdoor seating, offering beautiful views. Perfect spot for morning coffee or evening relaxation.",
        office:
          "Dedicated workspace with desk, comfortable chair, and high-speed internet connection. Ideal for remote work or study.",
        laundry:
          "In-unit laundry facilities with modern washer and dryer. Includes iron, ironing board, and basic laundry supplies.",
      },
      rule: {
        "No Smoking":
          "Smoking is strictly prohibited inside the property and within 25 feet of any entrance. This includes e-cigarettes, vaping devices, and any form of tobacco products. Violation may result in additional cleaning fees. Designated smoking areas are available outside.",
        "No Pets":
          "To maintain a clean and allergy-free environment, pets are not permitted on the property. This includes all animals, regardless of size or type. Exception made for certified service animals with prior notification.",
        "No Parties":
          "Events, parties, and large gatherings are not allowed. This ensures peace and quiet for neighbors and maintains the property condition. Maximum occupancy must be respected at all times.",
        "Check-in time":
          "Standard check-in time is between 2:00 PM and 8:00 PM. Early check-in may be available upon request. Late check-ins must be arranged in advance. Self check-in instructions will be provided prior to arrival.",
        "Check-out time":
          "Check-out time is by 11:00 AM to allow proper cleaning and preparation for next guests. Late check-out may be available upon request, subject to availability.",
        "Quiet hours":
          "Quiet hours are from 10:00 PM to 8:00 AM. Please be mindful of neighbors and keep noise levels to a minimum during these hours.",
        "No shoes inside":
          "Please remove shoes when entering the property to maintain cleanliness. Indoor slippers are provided for your comfort.",
        "No food in bedrooms":
          "To prevent pest issues and maintain cleanliness, food consumption is restricted to dining and kitchen areas only.",
        "Clean after use":
          "Please clean and tidy up common areas after use. This includes washing dishes, wiping surfaces, and disposing of trash properly.",
        "Maximum occupancy":
          "The number of guests must not exceed the maximum occupancy stated in the booking. Additional guests must be approved in advance.",
        "No illegal activities":
          "Any illegal activities are strictly prohibited and will result in immediate termination of stay without refund.",
        "Respect neighbors":
          "Please be considerate of neighbors at all times. Excessive noise or disturbances may result in early termination of stay.",
      },
      safety: {
        "Smoke Alarm":
          "Property is equipped with modern smoke detectors on every floor and in each bedroom. Devices are regularly tested and maintained. Battery backup ensures continuous operation during power outages.",
        "First Aid Kit":
          "Comprehensive first aid supplies are available in the clearly marked cabinet in the main bathroom. Includes bandages, antiseptic wipes, pain relievers, and basic medical supplies.",
        "Fire Extinguisher":
          "Fire extinguisher is located in the kitchen area and clearly marked. Additional extinguishers are placed on each floor. All are regularly inspected and maintained.",
        "Security Cameras":
          "External security cameras monitor the property entrance and parking areas for your safety. Cameras are not present in any private or indoor spaces.",
        "Emergency Exit":
          "Clearly marked emergency exits with illuminated signs. Emergency evacuation plans are posted throughout the property.",
        "Carbon Monoxide Detector":
          "CO detectors installed near all fuel-burning appliances and sleeping areas. Regularly tested and maintained for optimal performance.",
        "Security System":
          "Property is protected by a modern security system with 24/7 monitoring. Includes door and window sensors, motion detectors, and direct connection to emergency services.",
        Safe: "In-room safe available for securing valuables. Electronic operation with personal code setting capability.",
        "Emergency Contact":
          "Local emergency numbers and property manager contact information clearly posted in the unit. 24/7 support available for urgent issues.",
        "Outdoor Lighting":
          "Motion-activated security lights installed around the property perimeter. Well-lit pathways and entrances for safety.",
        "Deadbolt Locks":
          "High-security deadbolt locks on all exterior doors. Additional security features include peepholes and door chains.",
        "Window Locks":
          "All windows equipped with secure locking mechanisms. Ground floor windows have additional security features.",
        "Security Guard":
          "24/7 security personnel on premises. Regular patrols and monitoring of all common areas.",
        "Intercom System":
          "Modern intercom system for visitor screening and secure building access.",
        "Emergency Power":
          "Backup generator system ensures essential services during power outages.",
        Surveillance:
          "Professional security monitoring with 24-hour response capability.",
      },
    };

    // If the exact item isn't found, try to find a similar one
    const itemLower = item.toLowerCase();
    const type_descriptions = descriptions[type];

    // First try to find exact match
    if (type_descriptions[item]) {
      return type_descriptions[item];
    }

    // If no exact match, try to find partial match
    for (let key in type_descriptions) {
      if (
        key.toLowerCase().includes(itemLower) ||
        itemLower.includes(key.toLowerCase())
      ) {
        return type_descriptions[key];
      }
    }

    // If still no match, return a generic but informative description based on type
    const genericDescriptions = {
      room: `This ${item.toLowerCase()} is fully furnished and equipped with all necessary amenities for a comfortable stay. Features modern fixtures, good lighting, and ample space for your needs.`,
      rule: `This house rule ensures the comfort and safety of all guests. Please comply with this requirement throughout your stay. Contact the host for any specific questions.`,
      safety: `This safety feature is regularly maintained and tested to ensure your security during your stay. Instructions for proper use are provided in the property guide.`,
    };

    return genericDescriptions[type];
  };

  // Add this handler for item clicks
  const handleItemClick = (type, title, icon) => {
    setSelectedDetail({
      title,
      description: getDetailedDescription(type, title),
      icon,
    });
    setShowDetailModal(true);
  };

  // Add this modal component
  const DetailModal = () => (
    <Modal
      visible={showDetailModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <MaterialIcons
              name={selectedDetail.icon}
              size={24}
              color="#2C3E50"
            />
            <Text style={styles.detailModalTitle}>{selectedDetail.title}</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <MaterialIcons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailModalDescription}>
            {selectedDetail.description}
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Update the room configuration section
  const RoomConfigurationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Room Configuration</Text>
      <View style={styles.roomConfig}>
        {post.roomConfiguration &&
          post.roomConfiguration.split(", ").map((item, index) => {
            const [count, type] = item.split(" ");
            let iconName = type.toLowerCase().includes("bed")
              ? "bed"
              : type.toLowerCase().includes("bath")
              ? "shower"
              : type.toLowerCase().includes("garage")
              ? "garage"
              : "home";

            return (
              <TouchableOpacity
                key={index}
                style={styles.roomType}
                onPress={() => handleItemClick("room", type, iconName)}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={24}
                  color="#333"
                />
                <Text style={styles.roomText}>
                  {count} {type}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );

  // Update the house rules section
  const HouseRulesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>House rules</Text>
      <View style={styles.rulesContainer}>
        {post.houseRules &&
          post.houseRules.split(", ").map((rule, index) => (
            <TouchableOpacity
              key={index}
              style={styles.ruleItem}
              onPress={() => handleItemClick("rule", rule, getRuleIcon(rule))}
            >
              <MaterialIcons name={getRuleIcon(rule)} size={24} color="#333" />
              <Text style={styles.ruleText}>{rule}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );

  // Update the safety section
  const SafetySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety & property</Text>
      <View style={styles.rulesContainer}>
        {post.safetyProperty &&
          post.safetyProperty.split(", ").map((safety, index) => (
            <TouchableOpacity
              key={index}
              style={styles.ruleItem}
              onPress={() =>
                handleItemClick("safety", safety, getSafetyIcon(safety))
              }
            >
              <MaterialIcons
                name={getSafetyIcon(safety)}
                size={24}
                color="#333"
              />
              <Text style={styles.ruleText}>{safety}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <ScrollView style={styles.wrapper}>
        <View style={styles.wrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageScrollContainer}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageSlide}
                onPress={() => handleImagePress(image)}
              >
                {image && image.url ? (
                  <Image
                    source={{ uri: image.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.errorText}>Image not available</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.iconRow}>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconContainer}>
              <Icon name="visibility" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.iconText}>View</Text>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconContainer}>
              <Icon name="pets" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.iconText}>Pets Allowed</Text>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconContainer}>
              <Icon name="wifi" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.iconText}>Free Wifi</Text>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconContainer}>
              <Icon name="beach-access" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.iconText}>Beach</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.section}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons
                name="home-heart"
                size={28}
                color="#2C3E50"
              />
              <Text style={styles.sectionTitle}>{post.title}</Text>
            </View>
            <Text style={styles.detailText}>{post.description}</Text>
            <View style={styles.priceContainer}>
              <MaterialIcons name="attach-money" size={24} color="#16a34a" />
              <Text style={styles.priceValue}>{post.price}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rooms and Guests</Text>
            <Text style={styles.detailText}>1 room • 2 adults • 1 child</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <Text style={styles.detailText}>{post.cancellationPolicy}</Text>
          </View>

          <RoomConfigurationSection />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            {post.map && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(post.map.latitude),
                  longitude: parseFloat(post.map.longitude),
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(post.map.latitude),
                    longitude: parseFloat(post.map.longitude),
                  }}
                  title={post.title}
                  description={post.location}
                />
              </MapView>
            )}
            <View style={styles.locationDetails}>
              <Icon name="location-on" size={24} color="#000" />
              <Text style={styles.locationText}>
                <Text style={styles.location}>{post.location}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <Text style={styles.detailText}>{post.houseRules}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Information</Text>
            <Text style={styles.detailText}>{post.safetyProperty}</Text>
          </View>
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.chatSection}
              onPress={() => {
                if (!post?.userId) {
                  Alert.alert("Error", "Cannot identify the property owner");
                  return;
                }
                handleChatWithReceiver(post.userId, {
                  firstName: post.user?.firstName || "Property owner",
                  lastName: post.user?.lastName || "",
                  image: post.user?.image || "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png",
                });
              }}
            >
              
              <View style={styles.ownerInfo}>
                <Image 
                  source={{
                    uri: post.user?.image || "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png"
                  }}
                  style={styles.ownerImage}
                />
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>{post.user?.firstName || "Property"} {post.user?.lastName || "Owner"}</Text>
                  <Text style={styles.ownerTitle}>Owner {post.title}</Text>
                </View>
                <MaterialIcons name="phone" size={24} color="#666666" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Reviews</Text>
            {Array.isArray(comments) && comments.length > 0 ? (
              <>
                {comments
                  .slice(0, COMMENTS_PREVIEW_COUNT)
                  .map((comment, index) => (
                    <View key={index} style={styles.review}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{
                            uri:
                              comment.user?.image ||
                              "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png",
                          }}
                          style={styles.reviewerImage}
                        />
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>
                            {comment.user?.firstName} {comment.user?.lastName}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {comment.rating && (
                          <View style={styles.ratingContainer}>
                            {[...Array(5)].map((_, i) => (
                              <Icon
                                key={i}
                                name="star"
                                size={16}
                                color={
                                  i < comment.rating ? "#FFD700" : "#D3D3D3"
                                }
                              />
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.reviewText}>{comment.content}</Text>
                      {comments.length > COMMENTS_PREVIEW_COUNT && (
                        <TouchableOpacity onPress={handleSeeMorePress}>
                          <Text style={styles.seeAllReviews}>
                            See all {comments.length} reviews
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
              </>
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
      <Navbar navigation={navigation} style={styles.navbar} />
      <ImageModal />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showAllComments}
        onRequestClose={() => setShowAllComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                All Reviews ({comments.length})
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowAllComments(false)}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalCommentsList}
              contentContainerStyle={styles.modalCommentsContent}
              showsVerticalScrollIndicator={false}
            >
              {Array.isArray(comments) ? (
                comments.map((comment, index) => (
                  <View key={index} style={styles.review}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerImageContainer}>
                        <Image
                          source={{
                            uri:
                              comment.user?.image ||
                              "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png",
                          }}
                          style={styles.reviewerImage}
                        />
                      </View>
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>
                          {comment.user?.firstName} {comment.user?.lastName}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {comment.rating && (
                        <View style={styles.ratingContainer}>
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={16}
                              color={i < comment.rating ? "#FFD700" : "#D3D3D3"}
                              style={styles.starIcon}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={styles.reviewText}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviews}>No reviews available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {userCanComment && (
        <TouchableOpacity
          style={styles.addCommentButton}
          onPress={() => setShowCommentModal(true)}
        >
          <Icon name="rate-review" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Review</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowCommentModal(false)}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSelector}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Icon
                      name="star"
                      size={32}
                      color={star <= rating ? "#FFD700" : "#D3D3D3"}
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write your review here..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddComment}
              disabled={!newComment.trim() || rating === 0}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {userCanReport && (
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Icon name="report-problem" size={24} color="#FF4444" />
        </TouchableOpacity>
      )}

      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowReportModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.reportModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Report Listing</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setShowReportModal(false)}
                  >
                    <Icon name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.reportContent}
                  contentContainerStyle={styles.reportContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.reportSubtitle}>Select all that apply:</Text>

                  <View style={styles.checkboxContainer}>
                    <Checkbox.Item
                      label="Inappropriate Content"
                      status={reportReasons.inappropriate ? "checked" : "unchecked"}
                      onPress={() =>
                        setReportReasons((prev) => ({
                          ...prev,
                          inappropriate: !prev.inappropriate,
                        }))
                      }
                      style={styles.checkbox}
                      labelStyle={styles.checkboxLabel}
                    />
                    <Checkbox.Item
                      label="Spam"
                      status={reportReasons.spam ? "checked" : "unchecked"}
                      onPress={() =>
                        setReportReasons((prev) => ({
                          ...prev,
                          spam: !prev.spam,
                        }))
                      }
                      style={styles.checkbox}
                      labelStyle={styles.checkboxLabel}
                    />
                    <Checkbox.Item
                      label="Offensive Behavior"
                      status={reportReasons.offensive ? "checked" : "unchecked"}
                      onPress={() =>
                        setReportReasons((prev) => ({
                          ...prev,
                          offensive: !prev.offensive,
                        }))
                      }
                      style={styles.checkbox}
                      labelStyle={styles.checkboxLabel}
                    />
                    <Checkbox.Item
                      label="Potential Scam"
                      status={reportReasons.scam ? "checked" : "unchecked"}
                      onPress={() =>
                        setReportReasons((prev) => ({
                          ...prev,
                          scam: !prev.scam,
                        }))
                      }
                      style={styles.checkbox}
                      labelStyle={styles.checkboxLabel}
                    />
                    <Checkbox.Item
                      label="Incorrect Information"
                      status={reportReasons.incorrect ? "checked" : "unchecked"}
                      onPress={() =>
                        setReportReasons((prev) => ({
                          ...prev,
                          incorrect: !prev.incorrect,
                        }))
                      }
                      style={styles.checkbox}
                      labelStyle={styles.checkboxLabel}
                    />
                  </View>

                  <Text style={styles.reportSubtitle}>Additional Details:</Text>
                  <TextInput
                    style={styles.reportInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Please provide any additional information..."
                    value={reportText}
                    onChangeText={setReportText}
                    textAlignVertical="top"
                  />
                </ScrollView>

                <TouchableOpacity
                  style={styles.submitReportButton}
                  onPress={handleReport}
                >
                  <Text style={styles.submitReportText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
      <DetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#F1EFEF",
  },
  wrapper: {
    flex: 1,
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  spacer: {
    height: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
    resizeMode: "cover",
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    opacity: 0.3,
  },
  activeDot: {
    opacity: 1,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  counterContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 10,
    zIndex: 1,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 70,
    padding: 40,
    width: "100%",
    height: 100,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    width: 50,
    height: 50,
    marginBottom: 4,
    elevation: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
    marginTop: 8,
    textAlign: "left",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  detailsContainer: {
    padding: 8,
    backgroundColor: "#F1EFEF",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  checkInOut: {
    flex: 1,
  },
  detailLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#007BFF",
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 16,
    marginBottom: 16,
    backgroundColor: "#F1EFEF",
  },
  sectionTitle: {
    marginLeft: 10,
    fontWeight: "bold",
    fontSize: 18,
    color: "#2C3E50",
  },
  detailText: {
    marginLeft: 11,
    fontSize: 14,
    marginBottom: 8,
    textAlign: "left",
    color: "#555",
    lineHeight: 20,
  },
  roomConfig: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  roomType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  roomText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
    flex: 1,
  },
  bedDetails: {
    fontSize: 14,
    color: "#555",
  },
  map: {
    width: "100%",
    height: 150,
    marginVertical: 12,
    borderRadius: 8,
  },
  locationDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  review: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerImageContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: "#95A5A6",
  },
  ratingContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  starIcon: {
    marginHorizontal: 1,
  },
  reviewText: {
    fontSize: 15,
    color: "#34495E",
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  noReviews: {
    textAlign: "center",
    fontSize: 16,
    color: "#95A5A6",
    fontStyle: "italic",
    marginTop: 20,
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
  },
  bookButton: {
    backgroundColor: "#2C3E50",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1EFEF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F1EFEF",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  iconWrapper: {
    alignItems: "center",
  },
  imageScrollContainer: {
    marginBottom: 16,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  fullWidthScrollView: {
    width: SCREEN_WIDTH,
  },
  fullWidthSlideContainer: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  fullWidthImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  description: {
    fontSize: 16,
    color: "#4a4a4a",
    marginBottom: 20,
    textAlign: "left",
    lineHeight: 24,
    letterSpacing: 0.3,
    paddingHorizontal: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  priceValue: {
    fontWeight: "800",
    color: "#16a34a",
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  commentsModalContainer: {
    backgroundColor: "#fff",
    height: "85%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C3E50",
    letterSpacing: 0.3,
  },
  closeModalButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
  },
  modalCommentsList: {
    flex: 1,
  },
  modalCommentsContent: {
    paddingBottom: 20,
  },
  seeAllReviews: {
    color: "#2C3E50",
    fontSize: 14,
    textDecorationLine: "underline",
    marginTop: 10,
  },
  addCommentButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#2C3E50",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commentModalContainer: {
    backgroundColor: "#fff",
    height: "60%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  ratingSelector: {
    marginVertical: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2C3E50",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  starIcon: {
    marginHorizontal: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#2C3E50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reportButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  reportModalContainer: {
    backgroundColor: "white",
    maxHeight: "90%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  reportContent: {
    maxHeight: "80%",
    paddingHorizontal: 20,
  },

  reportContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  reportInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    minHeight: 100,
    backgroundColor: "#fff",
  },

  submitReportButton: {
    backgroundColor: "#FF4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },

  submitReportText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  rulesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginVertical: 10,
  },

  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  ruleText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
    flex: 1,
  },

  houseRules: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  houseRulesText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
    flex: 1,
  },

  safetyAndProperty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  safetyAndPropertyText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
    flex: 1,
  },
  chatOwnerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 19,
    marginVertical: 8,
  },
  ownerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ownerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 11,
    marginLeft: -4,
    marginTop: -1,
  },
  ownerDetails: {
    justifyContent: "center",
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  ownerTitle: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 5,
  },
  phoneIconContainer: {
    width: 37,
    height: 37,
    backgroundColor: "#e0e0e0",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginTop: 6,
    marginRight: -12,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    padding: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailModalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  detailModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  detailModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    flex: 1,
    marginLeft: 10,
  },

  detailModalDescription: {
    fontSize: 16,
    color: "#34495E",
    lineHeight: 24,
  },
  
  chatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ownerTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default HomeDetails;

