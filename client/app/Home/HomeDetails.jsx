import React, { useEffect, useState } from "react";
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
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import Navbar from "./Navbar";
import ImageZoom from "react-native-image-pan-zoom";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [userCanComment, setUserCanComment] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    spam: false,
    offensive: false,
    scam: false,
    incorrect: false,
  });
  const [userCanReport, setUserCanReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch comments
        const commentsResponse = await axios.get(`${apiUrl}/posts/${post.id}/comments`);
        console.log('Comments data:', commentsResponse.data); // Debug log
        setComments(commentsResponse.data);

        // Fetch images
        const imagesResponse = await axios.get(`${apiUrl}/posts/images/${post.id}`);
        setImages(imagesResponse.data);

        // Add new check for user booking status
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const userId = decodedToken.id;
          
          const bookingResponse = await axios.get(
            `${apiUrl}/posts/${post.id}/check-booking/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          setUserCanComment(bookingResponse.data.hasBooked);
          setUserCanReport(bookingResponse.data.hasBooked);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, [post.id]);

  useEffect(() => {
    console.log('showAllComments state:', showAllComments);
    console.log('Current comments:', comments);
  }, [showAllComments, comments]);

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const handleConfirmBooking = () => {
    navigation.navigate("Booking", { post });
  };

  const handleSeeMorePress = () => {
    console.log('See more button pressed');
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
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setComments(prevComments => [response.data, ...prevComments]);
        setNewComment('');
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
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      // Check if user has booked before reporting
      if (!userCanReport) {
        Alert.alert(
          'Cannot Report',
          'You can only report properties you have previously booked.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if at least one reason is selected
      const hasSelectedReason = Object.values(reportReasons).some(value => value);
      if (!hasSelectedReason) {
        Alert.alert('Error', 'Please select at least one reason for reporting');
        return;
      }

      const response = await axios.post(
        `${apiUrl}/reports`,
        {
          postId: post.id,
          reasons: reportReasons,
          details: reportText
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We will review it shortly.',
          [{ text: 'OK', onPress: () => {
            setShowReportModal(false);
            setReportText('');
            setReportReasons({
              inappropriate: false,
              spam: false,
              offensive: false,
              scam: false,
              incorrect: false,
            });
          }}]
        );
      } else {
        throw new Error(response.data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit report. Please try again later.'
      );
    }
  };

  const handleChatWithReceiver = async (receiverId, receiverDetails) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("Login");
        return;
      }
  
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      
      // Don't allow chatting with yourself
      if (decodedToken.id === receiverId) {
        Alert.alert("Error", "You cannot chat with yourself");
        return;
      }
  
      // Create or get existing chat
      const response = await axios.post(
        `${apiUrl}/api/chat/create`,
        {
          userId: decodedToken.id,
          receiverId: receiverId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      // Make sure we have valid receiver details
      const otherUser = {
        id: receiverId,
        firstName: receiverDetails?.firstName || 'User',
        lastName: receiverDetails?.lastName || '',
        image: receiverDetails?.image || null
      };
  
      navigation.navigate("ChatScreen", {
        chatId: response.data.id,
        otherUser,
        receiverId: receiverId
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Could not start chat. Please try again.");
    }
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
          const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
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
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollContainer}
        >
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
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.description}>{post.description}</Text>
          <Text style={styles.price}>
            Price: <Text style={styles.priceValue}>${post.price}</Text>
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rooms and Guests</Text>
            <Text style={styles.detailText}>1 room • 2 adults • 1 child</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <Text style={styles.detailText}>{post.cancellationPolicy}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Configuration</Text>
            <View style={styles.roomConfig}>
              <View style={styles.roomType}>
                <Icon name="hotel" size={24} color="#000" />
                <Text style={styles.roomText}>One Bedroom</Text>
              </View>
              <Text style={styles.bedDetails}>{post.roomConfiguration}</Text>
            </View>
          </View>

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
        firstName: post.user?.firstName || 'Property Owner',
        lastName: post.user?.lastName || '',
        image: post.user?.image || null
      });
    }}
  >
    <MaterialCommunityIcons name="chat" size={24} color="#666666" />
    <Text style={styles.chatText}>Chat with the Owner</Text>
  </TouchableOpacity>
</View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Reviews</Text>
            {Array.isArray(comments) && comments.length > 0 ? (
              <>
                {comments.slice(0, COMMENTS_PREVIEW_COUNT).map((comment, index) => (
                  <View key={index} style={styles.review}>
                    <View style={styles.reviewHeader}>
                      <Image
                        source={{
                          uri: comment.user?.image || 'https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png'
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
                              color={i < comment.rating ? "#FFD700" : "#D3D3D3"}
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
              <Text style={styles.modalTitle}>All Reviews ({comments.length})</Text>
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
                            uri: comment.user?.image || 'https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png' 
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
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
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
        <View style={styles.modalOverlay}>
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

            <Text style={styles.reportSubtitle}>Select all that apply:</Text>
            
            <View style={styles.checkboxContainer}>
              <Checkbox.Item
                label="Inappropriate Content"
                status={reportReasons.inappropriate ? 'checked' : 'unchecked'}
                onPress={() => setReportReasons(prev => ({
                  ...prev,
                  inappropriate: !prev.inappropriate
                }))}
                style={styles.checkbox}
                labelStyle={styles.checkboxLabel}
              />
              <Checkbox.Item
                label="Spam"
                status={reportReasons.spam ? 'checked' : 'unchecked'}
                onPress={() => setReportReasons(prev => ({
                  ...prev,
                  spam: !prev.spam
                }))}
                style={styles.checkbox}
                labelStyle={styles.checkboxLabel}
              />
              <Checkbox.Item
                label="Offensive Behavior"
                status={reportReasons.offensive ? 'checked' : 'unchecked'}
                onPress={() => setReportReasons(prev => ({
                  ...prev,
                  offensive: !prev.offensive
                }))}
                style={styles.checkbox}
                labelStyle={styles.checkboxLabel}
              />
              <Checkbox.Item
                label="Potential Scam"
                status={reportReasons.scam ? 'checked' : 'unchecked'}
                onPress={() => setReportReasons(prev => ({
                  ...prev,
                  scam: !prev.scam
                }))}
                style={styles.checkbox}
                labelStyle={styles.checkboxLabel}
              />
              <Checkbox.Item
                label="Incorrect Information"
                status={reportReasons.incorrect ? 'checked' : 'unchecked'}
                onPress={() => setReportReasons(prev => ({
                  ...prev,
                  incorrect: !prev.incorrect
                }))}
                style={styles.checkbox}
                labelStyle={styles.checkboxLabel}
              />
            </View>

            <Text style={styles.reportSubtitle}>Additional Details:</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={3}
              placeholder="Please provide any additional information..."
              value={reportText}
              onChangeText={setReportText}
            />

            <TouchableOpacity 
              style={styles.submitReportButton}
              onPress={handleReport}
            >
              <Text style={styles.submitReportText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    top: 40,
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
    borderRadius: 50,
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
    elevation: 2,
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  detailsContainer: {
    padding: 16,
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
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 7,
    marginBottom: 8,
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
    alignItems: "center",
    marginTop: 16,
  },
  roomType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  roomText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerImageContainer: {
    shadowColor: '#000',
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
    borderColor: '#fff',
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: '#95A5A6',
  },
  ratingContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 1,
  },
  reviewText: {
    fontSize: 15,
    color: '#34495E',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  noReviews: {
    textAlign: 'center',
    fontSize: 16,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginTop: 20,
    backgroundColor: '#F8F9FA',
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
    color: "#555",
    marginBottom: 12,
    textAlign: "left",
    lineHeight: 24,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginTop: 8,
    textAlign: "center",
  },
  priceValue: {
    fontWeight: "bold",
    color: "#2C3E50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  commentsModalContainer: {
    backgroundColor: '#fff',
    height: '85%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  closeModalButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
  },
  modalCommentsList: {
    flex: 1,
  },
  modalCommentsContent: {
    paddingBottom: 20,
  },
  seeAllReviews: {
    color: '#2C3E50',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  addCommentButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#2C3E50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commentModalContainer: {
    backgroundColor: '#fff',
    height: '60%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
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
    fontWeight: '600',
    marginBottom: 10,
    color: '#2C3E50',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  reportModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '65%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },

  reportContent: {
    flex: 1,
  },

  reportSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 5,
  },

  checkboxContainer: {
    marginBottom: 10,
  },

  checkbox: {
    padding: 0,
    height: 40,
  },

  checkboxLabel: {
    fontSize: 14,
  },

  reportInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    height: 80,
    textAlignVertical: 'top',
  },

  submitReportButton: {
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },

  submitReportText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginVertical: 10,
  },
  chatText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default HomeDetails;