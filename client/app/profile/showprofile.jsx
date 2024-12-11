import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const ShowProfile = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.editButton}>
          <Text style={{ color: '#ffffff' }}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileImageText}>N</Text>
        </View>
        <Text style={styles.name}>Nicolas</Text>
        <Text style={styles.info}>Interior Design</Text>
        <Text style={styles.info}>Speaks French and Arabic</Text>
        <Text style={styles.info}>Lagos, Nigeria</Text>
      </View>
      <View style={styles.confirmationSection}>
        <Text style={styles.confirmationTitle}>Nicolas confirmed</Text>
        <Text style={styles.emailLabel}>Email address</Text>
        <Text style={styles.email}>Nicolas22@gmail.com</Text>
      </View>
      <View style={styles.tripsSection}>
        <Text style={styles.tripTitle}>Trips</Text>
        <View style={styles.tripCard}>
          <Text>Yonkers</Text>
          <Text>Feb 13-14, 2023</Text>
          <Text>Yonkers, New York, United States</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 40,
    color: '#ffffff',
    backgroundColor: '#808080',
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
  },
  emailLabel: {
    fontSize: 16,
    color: '#666',
  },
  email: {
    fontSize: 16,
    color: '#333',
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
});

export default ShowProfile;