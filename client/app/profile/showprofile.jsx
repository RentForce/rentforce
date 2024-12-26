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
          <View style={styles.bioHeader}>
            <Text style={styles.bioLabel}>About Me</Text>
          </View>
          <View style={styles.bioContent}>
            <Text style={styles.bioText}>{bio || 'No bio available'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.confirmationSection}>
        <Text style={styles.sectionTitle}>Confirmed Details</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Email address</Text>
          <Text style={styles.detailText}>{userData?.email}</Text>
          {userData?.phoneNumber && (
            <>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailText}>{userData.phoneNumber}</Text>
            </>
          )}
          {userData?.address && (
            <>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailText}>{userData.address}</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>History</Text>
        {history.length > 0 ? (
          history.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <Text style={styles.detailText}>
                Total Price: ${Number(item.totalPrice).toFixed(2)}
              </Text>
              <Text style={styles.detailLabel}>
                Booking Date: {new Date(item.bookingDate).toLocaleDateString()}
              </Text>
              <Text style={styles.detailLabel}>
                Check-in: {new Date(item.checkInDate).toLocaleDateString()}
              </Text>
              <Text style={styles.detailLabel}>
                Check-out: {new Date(item.checkOutDate).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.historyCard}>
            <Text style={styles.detailText}>No history recorded</Text>
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
    backgroundColor: '#F1EFEF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1EFEF',
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
    backgroundColor: '#082631',
    borderRadius: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#082631',
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
    color: '#082631',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
  },
  confirmationSection: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F1EFEF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#082631',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#082631',
    marginBottom: 15,
  },
  detailsContainer: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#082631',
    opacity: 0.8,
    marginTop: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#082631',
    fontWeight: '500',
    marginBottom: 5,
  },
  historySection: {
    marginVertical: 20,
  },
  historyCard: {
    padding: 15,
    backgroundColor: '#F1EFEF',
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#082631',
    shadowColor: '#082631',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#082631',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F1EFEF',
    shadowColor: '#082631',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  initialsText: {
    fontSize: 40,
    color: '#F1EFEF',
    fontWeight: 'bold',
  },
  bioContainer: {
    width: '100%',
    marginVertical: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#082631',
  },
  bioHeader: {
    backgroundColor: '#082631',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bioContent: {
    backgroundColor: '#F1EFEF',
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bioLabel: {
    color: '#F1EFEF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bioText: {
    fontSize: 16,
    color: '#082631',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ShowProfile;