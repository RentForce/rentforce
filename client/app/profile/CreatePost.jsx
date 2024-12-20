import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset';
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;


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

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const localUri = result.assets[0].uri;

            try {
                const formData = new FormData();
                formData.append('file', {
                    uri: localUri,
                    type: `image/${localUri.split('.').pop()}`,
                    name: `upload.${localUri.split('.').pop()}`
                });
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

                const cloudinaryResponse = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                const uploadedImageUrl = cloudinaryResponse.data.secure_url;
                setFormData({
                    ...formData,
                    images: JSON.stringify([uploadedImageUrl])
                });
            } catch (error) {
                console.error('Image upload error:', error);
                Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const imagesArray = formData.images ? JSON.parse(formData.images) : [];

            const response = await axios.post(
                'http://192.168.123.193:5000/user/posts',
                {
                    ...formData,
                    images: imagesArray
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('Post created:', response.data);
        } catch (error) {
            console.error('Error creating post:', 
                error.response ? error.response.data : error,
                'Full error:', error
            );
        }
    };

    return (
        <LinearGradient
            colors={['#F1EFEF', '#FFFFFF']}
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
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                <Text style={styles.imagePickerText}>Pick an Image</Text>
            </TouchableOpacity>
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
                colors={['#333333', '#000000']}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F1EFEF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#A9A9A9',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        color: '#333333',
    },
    imagePicker: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#A9A9A9',
        borderRadius: 8,
        marginBottom: 15,
    },
    imagePickerText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    picker: {
        height: 50,
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        color: '#333333',
    },
    buttonContainer: {
        marginTop: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    button: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default CreatePost;