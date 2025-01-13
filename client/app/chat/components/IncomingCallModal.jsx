import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const VIBRATION_PATTERN = Platform.select({
  ios: [0, 1000, 2000, 3000],
  android: [0, 1000, 2000, 3000],
});

const IncomingCallModal = ({ 
  visible, 
  callerName, 
  callerData,
  onAccept, 
  onReject,
  callType 
}) => {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    console.log('IncomingCallModal visible changed:', visible);
    console.log('Caller data:', callerData);

    if (visible) {
      console.log('Showing incoming call modal');
      // Start vibration
      Vibration.vibrate(VIBRATION_PATTERN, true);
      
      // Start animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      console.log('Hiding incoming call modal');
      // Stop vibration and animation when modal is hidden
      Vibration.cancel();
      animation.setValue(0);
    }

    return () => {
      Vibration.cancel();
      animation.setValue(0);
    };
  }, [visible, callerData]);

  const handleAccept = () => {
    console.log('Call accepted for caller:', callerName);
    Vibration.cancel();
    onAccept();
  };

  const handleReject = () => {
    console.log('Call rejected for caller:', callerName);
    Vibration.cancel();
    onReject();
  };

  const animatedScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  console.log('Rendering IncomingCallModal. Visible:', visible, 'Caller:', callerData);
  
  // Always render the modal but control its visibility with the visible prop
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleReject}
    >
      <BlurView
        style={styles.modalBackground}
        intensity={90}
        tint="dark"
      >
        <View style={styles.modalContent}>
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              {callerData?.image ? (
                <Image 
                  source={{ uri: callerData.image }} 
                  style={{ width: 100, height: 100, borderRadius: 50 }} 
                />
              ) : (
                <Ionicons name="person-circle" size={80} color="#fff" />
              )}
            </View>
            <Text style={styles.callerName}>{callerName}</Text>
            <Text style={styles.callStatus}>Incoming call...</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
              <View style={[styles.iconContainer, styles.rejectIconContainer]}>
                <Ionicons name="close" size={30} color="#fff" />
              </View>
              <Text style={[styles.buttonText, styles.rejectText]}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
            >
              <View style={[styles.iconContainer, styles.acceptIconContainer]}>
                <Ionicons name="call" size={30} color="#fff" />
              </View>
              <Text style={[styles.buttonText, styles.acceptText]}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    width: Platform.OS === 'ios' ? '85%' : '90%',
    maxWidth: 350,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000000',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  callStatus: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  button: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 80,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  acceptIconContainer: {
    backgroundColor: '#4CAF50',
  },
  rejectIconContainer: {
    backgroundColor: '#FF4B4B',
  },
  acceptButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  acceptText: {
    color: '#4CAF50',
  },
  rejectText: {
    color: '#FF4B4B',
  },
});

export default IncomingCallModal;
