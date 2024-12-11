import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const PersonalScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  console.log('User ID:', userId);

  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!userId) {
      console.error('User ID is undefined');
      return; // Prevent further execution if userId is not valid
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setUserData(data);
        setFormData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleUpdate = async () => {
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const updatedUser = response.data;
      setUserData(updatedUser);
      setIsEditing(false);
      
      navigation.navigate('Screen1', { updatedUser });
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Personal Info</Text>
      {['firstName', 'lastName', 'email', 'phoneNumber', 'address'].map((field) => (
        <View style={styles.row} key={field}>
          <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              onChangeText={(text) => setFormData({ ...formData, [field]: text })}
            />
          ) : (
            <Text style={styles.value}>{userData[field] || 'Not provided'}</Text>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name="pencil" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      ))}
      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    marginLeft: 10,
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  saveButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PersonalScreen;