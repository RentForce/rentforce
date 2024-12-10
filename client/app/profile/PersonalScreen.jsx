import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PersonalScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Personal Info</Text>
      <Text style={styles.label}>Legal name</Text>
      <Text style={styles.value}>Saif Mejri</Text>
      <Text style={styles.label}>Preferred first name</Text>
      <Text style={styles.value}>Not provided</Text>
      <Text style={styles.label}>Phone number</Text>
      <Text style={styles.value}>Provide phone number</Text>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>m***0@gmail.com</Text>
      <Text style={styles.label}>Address</Text>
      <Text style={styles.value}>Not provided</Text>
      <Text style={styles.label}>Emergency contact</Text>
      <Text style={styles.value}>Add</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
});

export default PersonalScreen;