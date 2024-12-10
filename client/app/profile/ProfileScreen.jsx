import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ProfileScreen = ({navigation}) => {


  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001877.png' }} 
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="pencil" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}  >Nicolas Adams</Text>
        <Text style={styles.profileEmail}>nicolasadams@gmail.com</Text>
      </View>

      <View style={styles.accountSettings}>
        {[
         { label: 'Personal information', icon: 'person' },
         { label: 'Payments and payouts', icon: 'card' },
         { label: 'Notifications', icon: 'notifications' },
         { label: 'Privacy and sharing', icon: 'lock-closed' },
         { label: 'Travel for work', icon: 'briefcase' },
         { label: 'Logout', icon: 'exit' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.settingItem}>
            <View style={styles.settingContent}  >
              <Ionicons name={item.icon} size={20} color="#333" />
              <Text style={styles.settingText} onPress={() => navigation.navigate('Screen2')} >{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginTop: 50,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#808080',
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  accountSettings: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    marginVertical: 5,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
});

export default ProfileScreen;