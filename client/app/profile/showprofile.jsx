import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const ShowProfile = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.editButton}>
          <Text>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileImageText}>C</Text>
        </View>
        <Text style={styles.name}>Christopher</Text>
        <Text style={styles.info}>Interior Design</Text>
        <Text style={styles.info}>Speaks French and Arabic</Text>
        <Text style={styles.info}>Lagos, Nigeria</Text>
      </View>
      <View style={styles.confirmationSection}>
        <Text style={styles.confirmationTitle}>Melissa confirmed</Text>
        <Text style={styles.emailLabel}>Email address</Text>
        <Text style={styles.email}>melissa22@gmail.com</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 40,
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  info: {
    fontSize: 16,
    color: '#666',
  },
  confirmationSection: {
    marginVertical: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  tripCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
  },
});

export default ShowProfile;