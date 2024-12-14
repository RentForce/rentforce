import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
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
    
            const response = await axios.post('http://192.168.11.149:5000/user/posts', 
                {
                    ...formData,
                    images: formData.images ? JSON.stringify(formData.images) : []
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
            colors={['rgba(61,85,96,1)', 'rgba(144,146,150,1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container} // Apply styles
        >
            <TextInput
                placeholder="Title"
                onChangeText={(value) => handleChange('title', value)}
                value={formData.title}
                required
                style={styles.input} // Apply input styles
            />
            <TextInput
                placeholder="Images (JSON format)"
                onChangeText={(value) => handleChange('images', value)}
                value={formData.images}
                style={styles.input} // Apply input styles
            />
            <TextInput
                placeholder="Description"
                onChangeText={(value) => handleChange('description', value)}
                value={formData.description}
                required
                style={styles.input} // Apply input styles
            />
            <TextInput
                placeholder="Location"
                onChangeText={(value) => handleChange('location', value)}
                value={formData.location}
                style={styles.input} // Apply input styles
            />
            <TextInput
                placeholder="Price"
                keyboardType="numeric"
                onChangeText={(value) => handleChange('price', value)}
                value={formData.price}
                required
                style={styles.input} // Apply input styles
            />
            <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => handleChange('category', itemValue)}
                required
                style={styles.picker} // Apply picker styles
            >
                <Picker.Item label="Select Category" value="" />
                <Picker.Item label="House" value="house" />
                <Picker.Item label="Apartment" value="apartment" />
                <Picker.Item label="Villa" value="villa" />
                <Picker.Item label="Hotel" value="hotel" />
                {/* Add other categories as needed */}
            </Picker>
            <Button title="Create Post" onPress={handleSubmit} />
        </LinearGradient>
    );
};

// Styles for the component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    picker: {
        height: 50,
        marginBottom: 15,
        borderRadius: 5,
        backgroundColor: 'white',
    },
});

export default CreatePost;