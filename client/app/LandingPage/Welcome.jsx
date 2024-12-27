import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const Welcome = ({ navigation }) => {
  return (
    <ImageBackground
      source={require('../assets/landing.jpg')}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.gradientOverlay1} />
        <View style={styles.gradientOverlay2} />
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Explore Your</Text>
            <Text style={styles.subtitle}>Dream House</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <AntDesign name="arrowright" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  gradientOverlay1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gradientOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 40,
  },
  textContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
  },
});

export default Welcome;
