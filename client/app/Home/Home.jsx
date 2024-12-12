import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
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
  villa: "home-sharp",
  hotel: "bed-outline",
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
      const baseUrl = "http://192.168.195.93:3000";
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
          {post.images && post.images.length > 0 ? (
            <Image
              source={{ uri: post.images[0].url }}
              style={styles.postImage}
            />
          ) : (
            <Text>No Image Available</Text>
          )}
          <Ionicons
            name="heart-outline"
            size={24}
            color="black"
            style={styles.favoriteIcon}
          />
        </TouchableOpacity>
        <View style={styles.postDetails}>
          <Text style={styles.title}>{post.title}</Text>

          <Text style={styles.postLocation}>{post.location}</Text>
          <Text style={styles.postDistance}>{post.description}</Text>
          <Text style={styles.postDate}>{post.date}</Text>
          <Text style={styles.postRating}>
            ⭐ {post.rating} ({post.reviews})
          </Text>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={18} color="#222222" />
            </View>
            <View style={styles.searchInputContainer}>
              <TextInput
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
            <View style={styles.filterIconContainer}>
              <Ionicons name="options-outline" size={18} color="#222222" />
            </View>
          </View>
        </TouchableOpacity>
        <View>
          <ScrollView
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
                    selectedCategory === category &&
                      !searchQuery &&
                      styles.activeTab,
                  ]}
                >
                  {typeof categoryIcons[category] === "function" ? (
                    categoryIcons[category]({
                      size: 24,
                      style: [
                        styles.tabIcon,
                        selectedCategory === category && styles.activeTabIcon,
                      ],
                    })
                  ) : (
                    <Ionicons
                      name={categoryIcons[category]}
                      size={24}
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
      <Navbar style={styles.navbar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1EFEF",
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
  },
  tabContainer: {
    alignItems: "center",
    marginRight: 24,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIcon: {
    color: "#717171",
    marginBottom: 8,
    opacity: 0.7,
  },
  activeTabIcon: {
    color: "#000000",
    opacity: 1,
  },
  tabText: {
    fontSize: 12,
    color: "#717171",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#000000",
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
    marginBottom: 20,
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
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  postDetails: {
    padding: 10,
  },
  postTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
  },
  postLocation: {
    fontSize: 16,
    color: "#374957",
    fontWeight: "bold",
  },
  postDistance: {
    fontSize: 14,
    color: "#888",
  },
  postDate: {
    fontSize: 14,
    color: "#888",
  },
  postRating: {
    fontSize: 14,
    color: "#374957",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  favoriteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
});

export default Home;
