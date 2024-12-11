import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Navbar from "./Navbar";

const HomeDetails = () => {
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        <View style={styles.imageGrid}>
          <Image
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEOCtnzTIr0XvekSC0cmBdmMbndBhwaFt8Ww&s",
            }}
            style={styles.image}
          />
          <Image
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp15S2dpJCV16tWdrWAViYP-_CbBAlPXz5BZweAkneWXsWnaipMHlZXEe14KjuEeYTG14&usqp=CAU",
            }}
            style={styles.image}
          />
          <Image
            source={{
              uri: "https://dlqxt4mfnxo6k.cloudfront.net/hallmarkhomesgroup.com/aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2J1aWxkZXJjbG91ZC9hNjQ3N2MyZjMwZmEzNjZlNzVjNjMzMGY4ZjBjNjVhMS53ZWJw/webp/800/800",
            }}
            style={styles.image}
          />
          <Image
            source={{
              uri: "https://dlqxt4mfnxo6k.cloudfront.net/renditionhomes.com/aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2J1aWxkZXJjbG91ZC83ZDhlNTczMzBhY2RkMzJkMWE3OWZkZDlhOGQ0Yjg5Mi5qcGVn/webp/1200/1200",
            }}
            style={styles.image}
          />
          <View style={styles.moreImages}>
            <Text style={styles.moreText}>+70</Text>
          </View>
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
        <Text style={styles.title}>Private room La Cambronne</Text>

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
            <Text style={styles.detailText}>
              Free Cancellation until 1 day before arrival
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Configuration</Text>
            <View style={styles.roomConfig}>
              <View style={styles.roomType}>
                <Icon name="hotel" size={24} color="#000" />
                <Text style={styles.roomText}>One Bedroom</Text>
              </View>
              <Text style={styles.bedDetails}>
                1 Double bed{"\n"}1 Single Bed
              </Text>
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
                Vasagatan 1, Nirmala, Stockholm, 101 24 Sweden
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House rules</Text>
            <Text style={styles.detailText}>Check-in: 6:00 PM - 11:00 PM</Text>
            <Text style={styles.detailText}>Checkout before 9:00 AM</Text>
            <Text style={styles.detailText}>2 guests maximum</Text>
            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety & property</Text>
            <Text style={styles.detailText}>No carbon monoxide alarm</Text>
            <Text style={styles.detailText}>
              Security camera/recording device
            </Text>
            <Text style={styles.detailText}>Smoke alarm</Text>
            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
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
  image: {
    width: "48%",
    height: 100,
    marginBottom: 8,
  },
  moreImages: {
    width: "48%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  moreText: {
    fontSize: 18,
    color: "#fff",
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
});

export default HomeDetails;
