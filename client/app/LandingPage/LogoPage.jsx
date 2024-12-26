import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import LottieView from 'lottie-react-native';

const LogoPage = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Welcome');
    }, 7000); // 7 seconds

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <Image
          source={require('../assets/land.jpeg')}
          style={styles.logo}
        />
        <Text style={styles.title}>RENT FORCE</Text>
      </View>
      <LottieView
        source={require('../assets/new.json')}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5f4fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
    marginTop: -50,
  },
  animation: {
    marginTop: 160,
    width: 200,
    height: 200,
  },
  title: {
    marginTop: -120,
    fontSize: 45,
    fontWeight: 'bold',
    color: 'green',
    textAlign: 'center',
    letterSpacing: 2,
  },
  overlay: {
    marginTop: 5 }
});

export default LogoPage;
