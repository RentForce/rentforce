import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const Welcome = ({ navigation }) => {
  return (
    <ImageBackground
    // source={{ uri: 'https://a0.muscache.com/im/pictures/miso/Hosting-54138769/original/e1dcfadb-1ff1-4ad8-8c82-2f25a351a864.jpeg?im_w=960&im_format=avif' }} // Replace with your image URL
    // source={{ uri: 'https://a0.muscache.com/im/pictures/miso/Hosting-54377673/original/9b129398-5644-458e-823f-8ac918644a87.jpeg?im_w=960&im_format=avif' }} // Replace with your image URL
    source={{ uri: 'https://a0.muscache.com/im/pictures/miso/Hosting-1009307940936592554/original/aae6b59d-c589-4ba1-b9f8-33a56ed5df01.jpeg?im_w=960&im_format=avif' }} // Replace with your image URL

    // source={{ uri: 'https://a0.muscache.com/im/pictures/7637816f-3817-4ca9-a381-82723cc9e220.jpg?im_w=960&im_format=avif' }} // Replace with your image URL
      style={styles.background}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Explore Your</Text>
        <Text style={styles.subtitle}>Dream House</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <AntDesign name="arrowright" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 550,
    marginLeft: -60,
    // marginRight: 10,
  },
  title: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 42,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 35,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#000',
    
  },
  buttonText: {
    color: 'black',
    fontSize: 19,
    marginRight: 5,
    fontWeight: 'bold',
  },
});

export default Welcome;
