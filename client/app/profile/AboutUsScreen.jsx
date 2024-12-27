import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutUsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#F1EFEF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.text}>
          HomeRental connects people with their perfect living spaces. We're committed to making house hunting simple, secure, and satisfying for everyone.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Offer</Text>
        <View style={styles.featureList}>
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>🏠 Diverse Properties</Text>
            <Text style={styles.featureText}>From cozy apartments to luxury homes, find the perfect space that matches your lifestyle.</Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>💰 Transparent Pricing</Text>
            <Text style={styles.featureText}>Clear pricing with no hidden fees. Pay securely through our platform.</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureTitle}>✓ Verified Listings</Text>
            <Text style={styles.featureText}>All properties and hosts are verified for your safety and peace of mind.</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureTitle}>📱 Easy Management</Text>
            <Text style={styles.featureText}>Manage your rentals, payments, and communications all in one place.</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          Email: Rentforce@gmail.com{'\n'}
          Phone: +216 53 766 111{'\n'}
          Hours: 24/7 Customer Support
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1EFEF',
  },
  headerContainer: {
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  backButton: {
    backgroundColor: '#082631',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#082631',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#082631',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#082631',
  },
  featureList: {
    marginTop: 10,
  },
  feature: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#082631',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082631',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#082631',
    lineHeight: 22,
  },
});

export default AboutUsScreen;
