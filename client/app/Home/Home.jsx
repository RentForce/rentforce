import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
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

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPostsByCategory(selectedCategory);
  }, [selectedCategory]);

  const fetchPostsByCategory = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://192.168.104.2:3000/posts/${category}`
      );
      console.log(response.data, "s");

      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      console.log(error, "error");
    } finally {
      setLoading(false);
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
        <TouchableOpacity onPress={() => navigation.navigate("HomeDetails")}>
          {post.images && post.images.length > 0 ? (
            <Image source={{ uri: post.images[0].url }} style={styles.postImage} />
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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.placeholderText}>Where to?</Text>
            <Text style={styles.subText}>Anywhere · Any week · Add guests</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={20} style={styles.icon} />
          </TouchableOpacity>
        </View>
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
          >
            {categories.map((category) => (
              <View key={category} style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.tab,
                    selectedCategory === category && styles.activeTab,
                  ]}
                >
                  <Ionicons
                    name={
                      typeof categoryIcons[category] === "function"
                        ? null
                        : categoryIcons[category]
                    }
                    size={24}
                    style={[
                      styles.tabIcon,
                      selectedCategory === category && styles.activeTabText,
                    ]}
                  />
                  {typeof categoryIcons[category] === "function" &&
                    categoryIcons[category]({
                      size: 24,
                      style: [
                        styles.tabIcon,
                        selectedCategory === category && styles.activeTabText,
                      ],
                    })}
                  <Text
                    style={[
                      styles.tabText,
                      selectedCategory === category && styles.activeTabText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
                {selectedCategory === category && (
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  tabIcon: {
    marginBottom: 2,
    color: "#374957",
    fontSize: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    marginBottom: -2,
  },
  tabText: {
    fontSize: 12,
    color: "#F1EFEF",
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: {
    color: "#374957",
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
  tabContainer: {
    alignItems: "center",
  },
  scrollBar: {
    height: 0.1,
    backgroundColor: "#000",
    width: "100%",
    marginTop: 2,
  },
  activeTabIcon: {
    color: "#0A0A0A",
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
