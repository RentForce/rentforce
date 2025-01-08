import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const PostsHistory = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "",
    cancellationPolicy: "",
    roomConfiguration: "",
    houseRules: "",
    safetyProperty: "",
    images: []
  });
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('No user data found');
      }

      const { id: userId } = JSON.parse(userData);
      
      console.log('Fetching posts for user:', userId);
      console.log('API URL:', `${apiUrl}/user/posts/${userId}`);

      const response = await axios.get(`${apiUrl}/user/posts/${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Posts response:', response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load posts');
      Alert.alert('Error', 'Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${apiUrl}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchUserPosts(); // Refresh the list
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setEditFormData({
      title: post.title || "",
      description: post.description || "",
      price: post.price?.toString() || "",
      location: post.location || "",
      category: post.category || "",
      cancellationPolicy: post.cancellationPolicy || "",
      roomConfiguration: post.roomConfiguration || "",
      houseRules: post.houseRules || "",
      safetyProperty: post.safetyProperty || "",
      images: post.images ? post.images.map(image => image.url) : []
    });
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      category: "",
      cancellationPolicy: "",
      roomConfiguration: "",
      houseRules: "",
      safetyProperty: "",
      images: []
    });
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEditFormData(prev => ({
        ...prev,
        images: result.assets.map(asset => asset.uri)
      }));
    }
  };

  const handleUpdate = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let uploadedImageUrls = [];
      if (editFormData.images.length > 0) {
        uploadedImageUrls = await Promise.all(
          editFormData.images.map(async (imageUri) => {
            const formData = new FormData();
            formData.append("file", {
              uri: imageUri,
              type: "image/jpeg",
              name: "image.jpg",
            });
            formData.append("upload_preset", "ignmh24s");

            const response = await axios.post(
              `https://api.cloudinary.com/v1_1/dfbrjaxu7/image/upload`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            return response.data.secure_url;
          })
        );
      }

      await axios.put(
        `${apiUrl}/posts/${postId}`,
        {
          ...editFormData,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setEditingPostId(null);
      fetchUserPosts();
      Alert.alert("Success", "Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update post"
      );
    }
  };

  const renderPost = (post) => {
    const isEditing = editingPostId === post.id;

    return (
      <View key={post.id} style={styles.postCard}>
        {isEditing ? (
          <>
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {editFormData.images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setEditFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.addImageText}>Add Images</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={editFormData.title}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, title: text }))}
              placeholder="Title"
            />
            <TextInput
              style={styles.input}
              value={editFormData.description}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, description: text }))}
              placeholder="Description"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editFormData.price}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, price: text }))}
              placeholder="Price per night"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={editFormData.location}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, location: text }))}
              placeholder="Location"
            />
            <TextInput
              style={styles.input}
              value={editFormData.category}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, category: text }))}
              placeholder="Category"
            />
            <TextInput
              style={styles.input}
              value={editFormData.cancellationPolicy}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, cancellationPolicy: text }))}
              placeholder="Cancellation Policy"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editFormData.roomConfiguration}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, roomConfiguration: text }))}
              placeholder="Room Configuration"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editFormData.houseRules}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, houseRules: text }))}
              placeholder="House Rules"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editFormData.safetyProperty}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, safetyProperty: text }))}
              placeholder="Safety Property"
              multiline
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => handleUpdate(post.id)}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.postHeader}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(post)}
                >
                  <Ionicons name="create" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(post.id)}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.postDescription}>{post.description}</Text>
            <Text style={styles.postStatus}>Status: {post.status}</Text>
            <Text style={styles.postPrice}>${post.price}/night</Text>
            <Text style={styles.postLocation}>Location: {post.location}</Text>
            <Text style={styles.postCategory}>Category: {post.category}</Text>
          </>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#F1EFEF', '#F1EFEF']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#082631" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={styles.messageText}>Loading posts...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : posts.length === 0 ? (
          <Text style={styles.messageText}>No posts found</Text>
        ) : (
          posts.map(renderPost)
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 16,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  postInfo: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
  },
  postDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 12,
    lineHeight: 24,
  },
  postStatus: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  postPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  postLocation: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  postCategory: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editButton: {
    backgroundColor: '#082631',
  },
  deleteButton: {
    backgroundColor: '#082631',
  },
  messageText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 17,
    color: '#666666',
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 17,
    color: '#D32F2F',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1A1A1A',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    
  },
  button: {
    padding: 14,
    borderRadius: 12,
    flex: 0.48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButton: {
    backgroundColor: '#082631',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingVertical: 8,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#082631',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addImageText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default PostsHistory; 