import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Fontisto,
} from "@expo/vector-icons";
import Navbar from "./Navbar";
import axios from "axios";

const categories = [
  "house",
  "apartment",
  "villa",
  "hotel",
  "historical",
  "lake",
  "beachfront",
  "countryside",
  "castles",
  "experiences",
  "camping",
  "desert",
  "luxe",
  "islands",
];

const categoryIcons = {
  house: "home-outline",
  apartment: "business-outline",
  villa: (props) => (
    <MaterialIcons name="villa" size={24} color="black" {...props} />
  ),
  hotel: (props) => (
    <FontAwesome5 name="hotel" size={24} color="black" {...props} />
  ),
  historical: "time-outline",
  lake: "water-outline",
  beachfront: (props) => <FontAwesome5 name="umbrella-beach" {...props} />,
  countryside: "leaf-outline",
  castles: (props) => <MaterialIcons name="castle" {...props} />,
  experiences: "rocket-outline",
  camping: (props) => <MaterialCommunityIcons name="campfire" {...props} />,
  desert: "sunny-outline",
  luxe: "diamond-outline",
  islands: (props) => <Fontisto name="island" {...props} />,
};

const Home = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");

  const searchInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (isSearching) {
      const delayDebounceFn = setTimeout(() => {
        fetchPostsByCategory(selectedCategory);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchPostsByCategory(selectedCategory);
    }
  }, [selectedCategory, searchQuery]);

  const fetchPostsByCategory = async (category) => {
    setLoading(true);
    try {
      const baseUrl = "http://192.168.126.93:5000";
      const endpoint = searchQuery
        ? `${baseUrl}/posts/all`
        : `${baseUrl}/posts/${category}`;

      console.log("Fetching from:", endpoint);

      const response = await axios.get(endpoint, {
        params: {
          search: searchQuery,
        },
      });

      console.log("Response data:", response.data);
      setPosts(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch posts:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setIsSearching(true);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    if (searchQuery) {
      setSearchQuery("");
      setIsSearching(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setModalVisible(false);
    // Optionally, trigger a search or fetch posts based on the selected category
  };

  const handleFilterSubmit = () => {
    // Here you would typically make an API call to fetch filtered posts
    console.log("Filters applied:", {
      selectedCategory,
      price,
      location,
      title,
    });
    setModalVisible(false);
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const tabWidth = 100; // Adjust this value based on your tab width
    const index = Math.round(contentOffsetX / tabWidth);
    const newCategory = categories[index];

    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
      // Optionally, you can trigger a fetch for posts here
      fetchPostsByCategory(newCategory);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (posts.length === 0) {
      return <Text>No posts available for this category.</Text>;
    }
    console.log(posts[0].images[0].url, "salem");

    return posts.map((post) => (
      <View key={post.id} style={styles.postContainer}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("HomeDetails", {
              post: post,
            })
          }
        >
          <View>
            <Image
              source={{
                uri: post.images[0]
                  ? post.images[0].url
                  : "https://cdn.vectorstock.com/i/500p/29/08/avatar-10-vector-37332908.jpg",
              }}
              style={styles.postImage}
            />
            <View style={styles.imageOverlay} />
          </View>
          <Ionicons
            name="heart-outline"
            size={24}
            color="black"
            style={styles.favoriteIcon}
          />
        </TouchableOpacity>
        <View style={styles.postDetails}>
          <View style={styles.postHeader}>
            <Text style={styles.postLocation}>{post.location}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{post.rating}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={styles.price}>
            <Text style={styles.priceValue}>${post.price}</Text>
            <Text style={styles.priceText}> night</Text>
          </Text>
        </View>
      </View>
    ));
  };

  const handleSearchIconPress = () => {
    // Navigate to Home when the search icon is pressed
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleSearchIconPress}
        style={styles.searchBarContainer}
      >
        <View style={styles.searchBar}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={18} color="#222222" />
          </View>
          <View style={styles.searchInputContainer}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor="#222222"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <Text style={styles.searchSubtext}>
              Anywhere • Any week • Add guests
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.filterIconContainer}
          >
            <Ionicons name="options-outline" size={18} color="#222222" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Advanced Filters</Text>

          <Text style={styles.filterLabel}>Category</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item)}
                style={styles.categoryItem}
              >
                {typeof categoryIcons[item] === "function" ? (
                  categoryIcons[item]({
                    size: 20,
                    color: "#007BFF",
                  })
                ) : (
                  <Ionicons
                    name={categoryIcons[item]}
                    size={20}
                    color="#007BFF"
                  />
                )}
                <Text style={styles.categoryText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={styles.filterLabel}>Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Max Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.filterLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.filterLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Post Title"
            value={title}
            onChangeText={setTitle}
          />

          <TouchableOpacity
            onPress={handleFilterSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {categories.map((category) => (
              <View key={category} style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => handleCategoryPress(category)}
                  style={[
                    styles.tab,
                    selectedCategory === category && styles.activeTab,
                  ]}
                >
                  {typeof categoryIcons[category] === "function" ? (
                    categoryIcons[category]({
                      size: 21,
                      style: [
                        styles.tabIcon,
                        selectedCategory === category && styles.activeTabIcon,
                      ],
                    })
                  ) : (
                    <Ionicons
                      name={categoryIcons[category]}
                      size={21}
                      style={[
                        styles.tabIcon,
                        selectedCategory === category && styles.activeTabIcon,
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.tabText,
                      selectedCategory === category && styles.activeTabText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
                {selectedCategory === category && !searchQuery && (
                  <View style={styles.scrollBar} />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.contentContainer}>
            <ScrollView>{renderContent()}</ScrollView>
          </View>
        </View>
      </ScrollView>
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEAEA",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  searchBarContainer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 40,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIconContainer: {
    marginRight: 12,
    marginLeft: 4,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
    padding: 0,
    margin: 0,
  },
  searchSubtext: {
    fontSize: 12,
    color: "#717171",
    marginTop: 2,
  },
  filterIconContainer: {
    marginLeft: 12,
    padding: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#DDDDDD",
  },
  icon: {
    marginHorizontal: 10,
  },
  inputContainer: {
    flex: 1,
  },
  placeholderText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  subText: {
    color: "#888",
  },
  categoryTabs: {
    flexDirection: "row",
    marginTop: 8,
    paddingLeft: 4,
  },
  tabContainer: {
    alignItems: "center",
    marginRight: 32,
    opacity: 0.9,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 50,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
  },
  tabIcon: {
    color: "#717171",
    marginBottom: 8,
    opacity: 0.7,
    height: 24,
    width: 24,
  },
  activeTabIcon: {
    color: "#000000",
    opacity: 1,
  },
  tabText: {
    fontSize: 10,
    color: "#717171",
    textTransform: "capitalize",
    fontWeight: "400",
    textAlign: "center",
    marginTop: 2,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F1EFEF",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollBar: {
    height: 2,
    backgroundColor: "#000000",
    width: "100%",
    marginTop: 8,
    borderRadius: 1,
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 340,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  postDetails: {
    padding: 16,
    backgroundColor: "#fff",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  postLocation: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    marginTop: 4,
  },
  priceValue: {
    fontWeight: "600",
    color: "#222222",
  },
  priceText: {
    color: "#222222",
  },
  favoriteIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  noImageContainer: {
    width: "100%",
    height: 280,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  noImageText: {
    color: "#717171",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTab: {
    backgroundColor: "#007BFF",
    transform: [{ scale: 1.05 }],
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
  },
  largeImage: {
    width: "100%",
    height: 380,
  },
  mediumImage: {
    width: "48%",
    height: 280,
  },
  smallImage: {
    width: "48%",
    height: 240,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  filterLabel: {
    fontSize: 18,
    marginVertical: 10,
    color: "#007BFF",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#F9F9F9",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryText: {
    fontSize: 18,
    marginLeft: 10,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default Home;
