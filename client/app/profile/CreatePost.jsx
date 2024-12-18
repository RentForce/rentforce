import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CreatePost = () => {
    const [formData, setFormData] = useState({
        title: '',
        images: '',
        description: '',
        location: '',
        price: '',
        category: ''
    });

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            // Debug: Log token before sending
            console.log('Token being sent:', token);

            // Prepare images for upload
            const imagesArray = formData.images ? JSON.parse(formData.images) : [];

            const uploadPromises = imagesArray.map(async (image) => {
                const formData = new FormData();
                formData.append('file', {
                    uri: image,
                    type: `image/${image.split('.').pop()}`,
                    name: `upload.${image.split('.').pop()}`
                });
                formData.append('upload_preset', "ignmh24s");

                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/ignmh24s/image/upload`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    }
                );
                return response.data.secure_url; // Return the uploaded image URL
            });

            const uploadedImages = await Promise.all(uploadPromises);

            const response = await axios.post(
                'http://192.168.51.193:5000/user/posts', 
                {
                    ...formData,
                    images: uploadedImages // Use uploaded image URLs
                }, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Ensure Bearer prefix
                    }
                }
            );
            console.log('Post created:', response.data);
        } catch (error) {
            // More detailed error logging
            console.error('Error creating post:', 
                error.response ? error.response.data : error,
                'Full error:', error
            );
        }
    };

    return (
        <LinearGradient
            colors={['#F1EFEF', '#FFFFFF']} // Gradient for background
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            <Text style={styles.title}>Create a New Post</Text>
            <TextInput
                placeholder="Title"
                onChangeText={(value) => handleChange('title', value)}
                value={formData.title}
                style={styles.input}
            />
            <TextInput
                placeholder="Images (JSON format)"
                onChangeText={(value) => handleChange('images', value)}
                value={formData.images}
                style={styles.input}
            />
            <TextInput
                placeholder="Description"
                onChangeText={(value) => handleChange('description', value)}
                value={formData.description}
                style={styles.input}
            />
            <TextInput
                placeholder="Location"
                onChangeText={(value) => handleChange('location', value)}
                value={formData.location}
                style={styles.input}
            />
            <TextInput
                placeholder="Price"
                keyboardType="numeric"
                onChangeText={(value) => handleChange('price', value)}
                value={formData.price}
                style={styles.input}
            />
            <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => handleChange('category', itemValue)}
                style={styles.picker}
            >
                <Picker.Item label="Select Category" value="" />
                <Picker.Item label="House" value="house" />
                <Picker.Item label="Apartment" value="apartment" />
                <Picker.Item label="Villa" value="villa" />
                <Picker.Item label="Hotel" value="hotel" />
            </Picker>
            <LinearGradient
                colors={['#333333', '#000000']} // Gradient for button
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonContainer}
            >
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Create Post</Text>
                </TouchableOpacity>
            </LinearGradient>
        </LinearGradient>
    );
};

// Styles for the component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F1EFEF', // Soft ash gray for background
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333', // Charcoal black for title
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#A9A9A9', // Soft ash gray border
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#FFFFFF', // White background for inputs
        fontSize: 16,
        color: '#333333', // Charcoal black text
    },
    picker: {
        height: 50,
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: '#FFFFFF', // White background for picker
        color: '#333333', // Charcoal black text
    },
    buttonContainer: {
        marginTop: 20,
        borderRadius: 8,
        overflow: 'hidden', // Ensures the gradient follows the button shape
    },
    button: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        color: '#FFFFFF', // White text for button
        fontWeight: 'bold',
    },
});

export default CreatePost;
