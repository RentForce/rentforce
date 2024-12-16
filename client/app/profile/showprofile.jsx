import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import axios from 'axios';


const API_BASE_URL = 'http://192.168.225.193:5000'; 

const ShowProfile = ({ navigation, route }) => {
  const userId = route.params?.userId;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bio, setBio] = useState('');
console.log(userId);
  // Add dummy trip data for testing
  const dummyTrips = [
    { id: 1, destination: 'Paris', date: '2023-06-15' },
    { id: 2, destination: 'New York', date: '2023-07-20' },
    { id: 3, destination: 'Tokyo', date: '2023-08-10' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          setUserData({ ...response.data, trips: dummyTrips }); 
          setBio(response.data.bio || '');
        } else {
          throw new Error('No data received');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to fetch user data');
        Alert.alert('Error', err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleBioUpdate = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/user/${userId}`, {
        ...userData,
        bio: bio
      });
      setUserData(response.data);
      Alert.alert('Success', 'Bio updated successfully!');
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio');
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('Screen2', { userId: userId })}
        >
          <Text style={{ color: '#ffffff' }}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {userData ? (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>
                {userData.firstName.charAt(0)}
              </Text>
            </View>
          ) : (
            <Image
              source={{ 
                uri:  'https://www.shutterstock.com/image-vector/user-icon-vector-trendy-flat-600nw-1720665448.jpg' 
              }}
              style={styles.profileImage}
              onError={(e) => console.log('Image load error', e.nativeEvent.error)}
            />
          )}
        </View>
        <Text style={styles.name}>
          {userData?.firstName} {userData?.lastName}
        </Text>
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{bio}</Text>
        </View>
      </View>
      <View style={styles.confirmationSection}>
        <Text style={styles.confirmationTitle}>Confirmed Details</Text>
        <Text style={styles.emailLabel}>Email address</Text>
        <Text style={styles.email}>{userData?.email}</Text>
        {userData?.phoneNumber && (
          <>
            <Text style={styles.emailLabel}>Phone Number</Text>
            <Text style={styles.email}>{userData.phoneNumber}</Text>
          </>
        )}
        {userData?.address && (
          <>
            <Text style={styles.emailLabel}>Address</Text>
            <Text style={styles.email}>{userData.address}</Text>
          </>
        )}
      </View>
      {/* Optional: Trips section can be added later if you have trip data */}
      <View style={styles.tripsSection}>
        <Text style={styles.tripTitle}>Trips</Text>
        {userData?.trips && userData.trips.length > 0 ? (
          userData.trips.map(trip => (
            <View key={trip.id} style={styles.tripCard}>
              <Text>{trip.destination} - {trip.date}</Text>
            </View>
          ))
        ) : (
          <View style={styles.tripCard}>
            <Text>No trips recorded</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    fontSize: 16,
  },
  retryText: {
    color: 'blue',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  editButton: {
    padding: 10,
    backgroundColor: '#808080',
    borderRadius: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
  },
  confirmationSection: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emailLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  email: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  tripsSection: {
    marginVertical: 20,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tripCard: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bioContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ShowProfile;