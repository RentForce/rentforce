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
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import Navbar from "./Navbar";
import ImageZoom from "react-native-image-pan-zoom";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HomeDetails = ({ route }) => {
  const { post } = route.params;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          `http://192.168.195.93:3000/posts/images/${post.id}` // Replace X with your IP
        );
        setImages(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching images:", err);
        setError("Failed to load images");
        setLoading(false);
      }
    };

    fetchImages();
  }, [post.id]);

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  // Image Modal Component
  const ImageModal = () => (
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

        {selectedImage && (
          <ImageZoom
            cropWidth={SCREEN_WIDTH}
            cropHeight={SCREEN_HEIGHT}
            imageWidth={SCREEN_WIDTH}
            imageHeight={SCREEN_HEIGHT}
          >
            <Image
              source={{ uri: selectedImage.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </ImageZoom>
        )}
      </View>
    </Modal>
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
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        <View style={styles.imageGrid}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleImagePress(image)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: image.url }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="visibility" size={24} color="#000" />
            <Text style={styles.iconText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="pets" size={24} color="#000" />
            <Text style={styles.iconText}>Pets Allowed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="wifi" size={24} color="#000" />
            <Text style={styles.iconText}>Free Wifi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconContainer}>
            <Icon name="beach-access" size={24} color="#000" />
            <Text style={styles.iconText}>Beach</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.description}</Text>
        <Text style={styles.price}>Price: ${post.price}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.checkInOut}>
              <Text style={styles.detailLabel}>Check-in</Text>
              <Text style={styles.detailValue}>Mon, 5 Dec</Text>
            </View>
            <View style={styles.checkInOut}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>Mon, 10 Dec</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rooms and Guests</Text>
            <Text style={styles.detailText}>1 room • 2 adults • 1 child</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            {/* <Text style={styles.detailText}>
              Free Cancellation until 1 day before arrival
            </Text> */}
            <Text style={styles.detailText}>{post.cancellationPolicy}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Configuration</Text>
            <View style={styles.roomConfig}>
              <View style={styles.roomType}>
                <Icon name="hotel" size={24} color="#000" />
                <Text style={styles.roomText}>One Bedroom</Text>
              </View>
              {/* <Text style={styles.bedDetails}>
                1 Double bed{"\n"}1 Single Bed
              </Text> */}
              <Text style={styles.bedDetails}>{post.roomConfiguration}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Image
              source={{
                uri: "https://c8.alamy.com/comp/DWGEWW/round-red-thumb-tack-pinched-through-copenhagen-on-denmark-map-part-DWGEWW.jpg",
              }} // Replace with actual map image URL
              style={styles.mapImage}
            />
            <View style={styles.locationDetails}>
              <Icon name="location-on" size={24} color="#000" />
              <Text style={styles.locationText}>
                <Text style={styles.location}> {post.location}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House rules</Text>

            <Text style={styles.detailText}>{post.houseRules}</Text>
            <Text style={styles.detailText}>Check-in: 6:00 PM - 11:00 PM</Text>
            <Text style={styles.detailText}>Checkout before 9:00 AM</Text>
            <Text style={styles.detailText}>2 guests maximum</Text>

            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety & property</Text>
            {/* <Text style={styles.detailText}>No carbon monoxide alarm</Text>
            <Text style={styles.detailText}>
              Security camera/recording device
            </Text>
            <Text style={styles.detailText}>Smoke alarm</Text>
            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity> */}
            <Text style={styles.detailText}>{post.safetyProperty}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What guests loved the most</Text>
            <View style={styles.review}>
              <Text style={styles.flag}>🇩🇰</Text>
              <Text style={styles.reviewText}>
                <Text style={styles.boldText}>Liam - Denmark</Text>
                {"\n"}Amazing place!! Location is great, and the hotel staff are
                very nice.
              </Text>
            </View>
            <View style={styles.review}>
              <Text style={styles.flag}>🇪🇪</Text>
              <Text style={styles.reviewText}>
                <Text style={styles.boldText}>Lia - Estonia</Text>
                {"\n"}Amazing place!! Location is great, and the hotel staff are
                very nice.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Request to book</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
      <Navbar style={styles.navbar} />
      <ImageModal />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: "#F1EFEF",
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
  },
  imageContainer: {
    width: "48%",
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
    width: "100%",
    height: 120,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
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
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    padding: 10,
  },
  iconContainer: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
  },
  iconText: {
    marginTop: 4,
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
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
    paddingBottom: 8,
    marginBottom: 16,
    backgroundColor: "#F1EFEF",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
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
  },
  bedDetails: {
    fontSize: 14,
  },
  mapImage: {
    width: "100%",
    height: 150,
    marginBottom: 8,
  },
  locationDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
  },
  showMoreText: {
    color: "#007BFF",
    fontSize: 14,
    marginTop: 8,
  },
  review: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  reviewText: {
    fontSize: 14,
    flex: 1,
  },
  boldText: {
    fontWeight: "bold",
  },
  bookButton: {
    backgroundColor: "#2C3E50",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 16,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default HomeDetails;
