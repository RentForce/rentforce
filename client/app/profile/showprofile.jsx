import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import axios from 'axios';

const apiUrl = process.env.EXPO_PUBLIC_API_URL


// const API_BASE_URL = 'http://192.168.255.93:5000'; 

const ShowProfile = ({ navigation, route }) => {
  const userId = route.params?.userId;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bio, setBio] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [userResponse, historyResponse] = await Promise.all([
          axios.get(`${apiUrl}/user/${userId}`),
          axios.get(`${apiUrl}/user/${userId}/history`)
        ]);

        if (userResponse.data) {
          setUserData(userResponse.data);
          setBio(userResponse.data.bio || '');
        }

        if (historyResponse.data) {
          setHistory(historyResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data');
        Alert.alert('Error', err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleBioUpdate = async () => {
    try {
      const response = await axios.put(`${apiUrl}/user/${userId}`, {
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
          onPress={() => navigation.navigate('personal', { userId: userId })}
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
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>History</Text>
        {history.length > 0 ? (
          history.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>
                Booking Date: {new Date(item.bookingDate).toLocaleDateString()}
              </Text>
              <Text style={styles.historyDate}>
                Check-in: {new Date(item.checkInDate).toLocaleDateString()}
              </Text>
              <Text style={styles.historyDate}>
                Check-out: {new Date(item.checkOutDate).toLocaleDateString()}
              </Text>
              <Text style={styles.historyStatus}>Status: {item.status}</Text>
              <Text style={styles.historyPrice}>
                Total Price: ${Number(item.totalPrice).toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.historyCard}>
            <Text>No history recorded</Text>
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
  historySection: {
    marginVertical: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  historyCard: {
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
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
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