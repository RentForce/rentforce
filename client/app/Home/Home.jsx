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
  FlatList, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChatBot from "../chatBot/ChatBot.jsx";

import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Fontisto,
  FontAwesome,
} from "@expo/vector-icons";
import Navbar from "./Navbar";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Slider from "@react-native-community/slider";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

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
  house: (props) => (
    <FontAwesome name="home" size={24} color="black" {...props} />
  ),
  apartment: (props) => (
    <MaterialIcons name="apartment" size={24} color="black" {...props} />
  ),
  villa: (props) => (
    <MaterialIcons name="villa" size={24} color="black" {...props} />
  ),
  hotel: (props) => (
    <FontAwesome5 name="hotel" size={24} color="black" {...props} />
  ),
  historical: (props) => (
    <MaterialIcons name="temple-buddhist" size={24} color="black" {...props} />
  ),
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
  const [userId, setUserId] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1200 });
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false);
  const chatBubbleTimeout = useRef(null);

  const searchInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  console.log(apiUrl, "saleeemm");

  const fetchUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      }
    } catch (error) {
      console.error("Error retrieving userId:", error);
    }
  };
  useEffect(() => {
    fetchUserId();
  }, []);

  const fetchFavorites = async () => {
    try {
      if (!userId) {
        console.log("No userId available, skipping favorites fetch");
        return;
      }

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token available, redirecting to login");
        navigation.navigate("Login");
        return;
      }

      const response = await axios.get(`${apiUrl}/user/favourites/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favoritePostIds = new Set(response.data.map((post) => post.id));
      setFavorites(favoritePostIds);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigation.navigate("Login");
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const handleAddFavourite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      // If no token, redirect to login
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      const response = await axios.post(
        `${apiUrl}/user/favourites`,
        {
          userId,
          postId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setFavorites((prevFavorites) => new Set(prevFavorites).add(postId));
      }
    } catch (err) {
      console.error("Error adding favourite:", err);
      // If token is invalid, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigation.navigate("Login");
      }
    }
  };

  const handleRemoveFavourite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("User token not found");
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      await axios.delete(`${apiUrl}/user/favourites`, {
        data: { userId, postId },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setFavorites((prevFavorites) => {
        const updatedFavorites = new Set(prevFavorites);
        updatedFavorites.delete(postId);
        return updatedFavorites;
      });
    } catch (err) {
      console.error("Error removing favourite:", err);
    }
  };

  const toggleFavorite = (postId) => {
    if (favorites.has(postId)) {
      handleRemoveFavourite(postId);
    } else {
      handleAddFavourite(postId);
    }
  };

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
      const baseUrl = `${apiUrl}`;
      let endpoint = `${baseUrl}/posts/all`;
      let params = {
        status: "APPROVED"
      };

      // Add search query if exists
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add category if not searching
      if (!searchQuery && category) {
        endpoint = `${baseUrl}/posts/posts/${category}`;
      }

      console.log("Fetching from:", endpoint, "with params:", params);

      const response = await axios.get(endpoint, { params });

      // If searching and category is selected, filter results by category
      let filteredPosts = response.data;
      if (searchQuery && category) {
        filteredPosts = response.data.filter(post => post.category.toLowerCase() === category.toLowerCase());
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      // Handle error appropriately
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

  const handleFilterSubmit = async () => {
    try {
      setLoading(true);

      // Fetch all posts first
      const response = await axios.get(`${apiUrl}/posts/all`);

      // Filter posts based on price range
      const filteredPosts = response.data.filter(
        (post) => post.price >= priceRange.min && post.price <= priceRange.max
      );

      // Update posts state with filtered results
      setPosts(filteredPosts);

      // Close the modal
      setModalVisible(false);

      // Show feedback to user
      if (filteredPosts.length === 0) {
        Alert.alert(
          "No Results",
          `No properties found between $${priceRange.min} and $${priceRange.max}`
        );
      } else {
        Alert.alert(
          "Filters Applied",
          `Showing ${filteredPosts.length} properties between $${priceRange.min} and $${priceRange.max}`
        );
      }
    } catch (error) {
      console.error("Error applying filters:", error);
      Alert.alert("Error", "Failed to apply filters. Please try again.");
    } finally {
      setLoading(false);
    }
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

    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Show bubble when scrolled past 200 pixels
    if (scrollY > 200 && !showChatBubble) {
      setShowChatBubble(true);
      // Hide bubble after 5 seconds
      if (chatBubbleTimeout.current) {
        clearTimeout(chatBubbleTimeout.current);
      }
      chatBubbleTimeout.current = setTimeout(() => {
        setShowChatBubble(false);
      }, 5000);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (posts.length === 0) {
      return <Text>No posts available for this category.</Text>;
    }

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
          <TouchableOpacity
            style={styles.favoriteIcon}
            onPress={() => toggleFavorite(post.id)}
          >
            <MaterialIcons
              name={favorites.has(post.id) ? "bookmark" : "bookmark-outline"}
              size={24}
              color={favorites.has(post.id) ? "#2C3E50" : "#000"}
            />
          </TouchableOpacity>
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
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>
              ${parseFloat(post.price).toFixed(2)}
            </Text>
            <Text style={styles.priceLabel}>/night</Text>
          </View>
          <View style={styles.roomConfiguration}>
            {post.roomConfiguration &&
              post.roomConfiguration.split(", ").map((item, index) => {
                const parts = item.split(" ");
                const count = parts[0];
                const type = parts[1];

                if (!type) return null;

                let iconComponent;
                switch (type.toLowerCase()) {
                  case "beds":
                    iconComponent = <FontAwesome5 name="bed" size={14} color="#FFFFFF" />;
                    break;
                  case "baths":
                    iconComponent = <FontAwesome5 name="bath" size={14} color="#FFFFFF" />;
                    break;
                  case "garage":
                    iconComponent = <FontAwesome name="car" size={14} color="#FFFFFF" />;
                    break;
                  default:
                    return null;
                }

                return (
                  <View key={index} style={styles.roomItem}>
                    {iconComponent}
                    <Text style={styles.roomText}>{count}</Text>
                  </View>
                );
              })}
          </View>
        </View>
      </View>
    ));
  };

  const handleSearchIconPress = () => {
    // Navigate to Home when the search icon is pressed
    navigation.navigate("Home");
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const response = await axios.get(`${apiUrl}/posts/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPosts(response.data);
    } catch (error) {
      if (error.response?.status === 401 && error.response?.data?.expired) {
        // Token is expired, try to refresh it
        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          const response = await axios.post(`${apiUrl}/user/refresh-token`, {
            refreshToken,
          });

          // Save new tokens
          await AsyncStorage.setItem("userToken", response.data.token);
          await AsyncStorage.setItem(
            "refreshToken",
            response.data.refreshToken
          );

          // Retry the original request
          fetchData();
        } catch (refreshError) {
          // If refresh fails, redirect to login
          console.error("Error refreshing token:", refreshError);
          navigation.navigate("Login");
        }
      } else {
        console.error("Error fetching data:", error);
        // Handle other errors
      }
    }
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
          <View style={styles.modalHeader}>
            <Text style={styles.filterLabel}>Category</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("Home");
              }}
              style={styles.closeIcon}
            >
              <Ionicons name="home" size={24} color="#333" />
            </TouchableOpacity>
          </View>
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

          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.priceRangeContainer}>
            <Text style={styles.priceRangeText}>
              ${priceRange.min} - ${priceRange.max}
            </Text>
            <MultiSlider
              values={[priceRange.min, priceRange.max]}
              min={0}
              max={1200}
              step={10}
              sliderLength={280}
              onValuesChange={(values) =>
                setPriceRange({ min: values[0], max: values[1] })
              }
              selectedStyle={{
                backgroundColor: "#007BFF",
                height: 3,
              }}
              unselectedStyle={{
                backgroundColor: "#DDDDDD",
                height: 3,
              }}
              containerStyle={{
                height: 40,
                marginBottom: 20,
              }}
              trackStyle={{
                height: 3,
                backgroundColor: "#DDDDDD",
              }}
              markerStyle={{
                height: 16,
                width: 16,
                borderRadius: 8,
                backgroundColor: "#007BFF",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 2,
                elevation: 3,
              }}
              pressedMarkerStyle={{
                height: 20,
                width: 20,
                borderRadius: 10,
              }}
            />
            <View style={styles.priceMarkersContainer}>
              {[0, 300, 600, 900, 1200].map((value) => (
                <Text key={value} style={styles.priceMarkerText}>
                  ${value}
                </Text>
              ))}
            </View>
          </View>

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

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007BFF" />
            </View>
          )}
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
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
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => setIsChatVisible(true)}
      >
        <MaterialCommunityIcons name="robot" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {showChatBubble && (
        <View style={styles.chatBubble}>
          <Text style={styles.chatBubbleText}>
            Need help finding the perfect place? I'm here to assist!
          </Text>
          <View style={styles.chatBubbleArrow} />
        </View>
      )}

      <ChatBot
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Positioned above the navbar
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#082631',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 2,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 40,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 6,
    paddingLeft: 2,
  },
  tabContainer: {
    alignItems: "center",
    marginRight: 10,
    marginTop: 6,
    marginLeft: 10,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 58,
    height: 58,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIcon: {
    color: '#666666',
    transform: [{ scale: 0.85 }],
  },
  tabText: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'capitalize',
    fontWeight: "400",
    textAlign: "center",
    marginTop: 2,
  },
  activeTab: {
    backgroundColor: '#F7F7F7',
    transform: [{ scale: 1.01 }],
    borderColor: '#2C3E50',
  },
  activeTabIcon: {
    color: '#2C3E50',
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  scrollBar: {
    height: 2,
    backgroundColor: "#000000",
    width: "100%",
    marginTop: 8,
    borderRadius: 31,
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    marginHorizontal: 4,
    width: '97%',
    alignSelf: 'center',
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  postDetails: {
    padding: 12,
    backgroundColor: '#082631',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 0,
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
    color: '#FFFFFF',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: '#FFFFFF',
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    marginTop: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceText: {
    color: "white",
  },
  favoriteIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  filterLabel: {
    fontSize: 16,
    marginVertical: 12,
    color: '#333333',
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
    fontSize: 14,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333",
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#2C3E50",
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007BFF",
    marginBottom: 20,
    textAlign: "center",
  },
  markersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    width: 2,
    height: 10,
    backgroundColor: "#DDDDDD",
  },
  markerText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 10,
  },
  closeIcon: {
    padding: 8,
    marginRight: -19,
  },
  roomConfiguration: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 45,
  },
  roomText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  priceRangeContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007BFF",
    marginBottom: 20,
    textAlign: "center",
  },
  priceMarkersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 8,
  },
  priceMarkerText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  chatBubble: {
    position: 'absolute',
    right: 85,
    bottom: 90,
    backgroundColor: '#082631',
    padding: 12,
    borderRadius: 16,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  chatBubbleArrow: {
    position: 'absolute',
    right: -10,
    bottom: 15,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderLeftWidth: 15,
    borderLeftColor: '#082631',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
});

export default Home;