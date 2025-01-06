import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LogoPage = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Welcome');
    }, 2500); // 7 seconds

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* <View style={styles.overlay}>
        <Image
          source={require('../assets/final.jpeg')}
          style={styles.logo}
        />
      </View> */}
      <LottieView
        source={require('../assets/logoani.json')}
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
    marginTop: 100,
  },
  animation: {
    marginTop: -50,
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

<<<<<<< HEAD
export default LogoPage;
=======
export default LogoPage;
>>>>>>> fbcd25425e219a1705d0fa2b06a8e12af458abff
