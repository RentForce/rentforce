import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Navbar from '../Home/Navbar'; // Adjust the path as necessary



const Favourites = ({ navigation }) => {
  const [favouritePosts, setFavouritePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('User token not found');
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;

        const response = await axios.get(`http://192.168.103.15:5000/user/favourites/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setFavouritePosts(response.data);
      } catch (err) {
        console.error('Error fetching favourites:', err);
        setError(err.message || 'Failed to fetch favourites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  const handleRemoveFavourite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('User token not found');
      }
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      await axios.delete(`http://192.168.103.15:5000/user/favourites`, {
        data: { userId, postId },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setFavouritePosts(favouritePosts.filter(post => post.id !== postId));
      Alert.alert('Success', 'Post removed from favourites');
    } catch (err) {
      console.error('Error removing favourite:', err);
      Alert.alert('Error', 'Failed to remove post from favourites');
    }
  };

  const handleSeeMore = (post) => {
    navigation.navigate("HomeDetails", { post });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.welcomeText}>Explore your favorites here!</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Chargement...</Text>
      ) : error ? (
        <Text style={styles.errorText}>Erreur: {error}</Text>
      ) : favouritePosts.length === 0 ? (
        <Text style={styles.emptyMessage}>No favorites yet. Add some now!</Text>
      ) : (
        <FlatList
          data={favouritePosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.postImage} />
              <View style={styles.textContainer}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postLocation}>{item.location}</Text>
                <Text style={styles.postPrice}>${item.price} / nuit</Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleRemoveFavourite(item.id)}
                >
                  <Ionicons name="heart-dislike" size={24} color="#ff4d4d" />
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate("HomeDetails", { post: item })}
                >
                  <MaterialIcons name="visibility" size={24} color="#007BFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.navbarContainer}>
        <Navbar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    paddingBottom: 60, // Add padding to prevent content from being hidden behind the navbar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  postLocation: {
    fontSize: 14,
    color: '#555',
  },
  postPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007BFF',
    marginTop: 4,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 4,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#ff4d4d',
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  navbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default Favourites;











