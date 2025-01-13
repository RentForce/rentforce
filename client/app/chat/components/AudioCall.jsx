import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { initiateCall, acceptCall, rejectCall, endCall, addSocketListener, removeSocketListener, getSocket } from '../Socket';
import IncomingCallModal from './IncomingCallModal';

const AudioCall = ({ 
  chatId, 
  receiverId, 
  onEndCall, 
  otherUser,
  currentUser 
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const audioRef = useRef(null);
  const socketCheckInterval = useRef(null);
  const ringtoneRef = useRef(null);

  // Initialize ringtone
  useEffect(() => {
    const loadRingtone = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/ringtone.mp3'),
          { shouldPlay: false }
        );
        ringtoneRef.current = sound;
      } catch (error) {
        console.warn('Could not load ringtone:', error);
      }
    };

    loadRingtone();

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.unloadAsync().catch(console.warn);
      }
    };
  }, []);

  const playRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.replayAsync();
      } else {
        // Fallback to vibration
        Vibration.vibrate([500, 1000, 500, 1000], true);
      }
    } catch (error) {
      console.warn('Could not play ringtone:', error);
      // Fallback to vibration
      Vibration.vibrate([500, 1000, 500, 1000], true);
    }
  };

  const stopRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.stopAsync();
      }
      Vibration.cancel();
    } catch (error) {
      console.warn('Could not stop ringtone:', error);
      Vibration.cancel();
    }
  };

  // Debug props
  useEffect(() => {
    console.log('AudioCall props:', {
      chatId,
      receiverId,
      otherUser,
      currentUser,
      isSocketReady
    });
  }, [chatId, receiverId, otherUser, currentUser, isSocketReady]);

  // Prevent calls while loading
  const isLoading = !otherUser || otherUser.name === 'Loading...' || 
                   !currentUser || currentUser.name === 'Loading...';

  useEffect(() => {
    console.log('AudioCall rendering:', {
      isCallActive,
      isIncomingCall,
      isSocketReady,
      isLoading,
      otherUserName: otherUser?.name,
      currentUserName: currentUser?.name
    });
  }, [isCallActive, isIncomingCall, isSocketReady, isLoading, otherUser, currentUser]);

  // Socket setup
  useEffect(() => {
    const checkSocket = () => {
      const socket = getSocket();
      if (socket && socket.connected) {
        console.log('Socket is ready and connected');
        setIsSocketReady(true);
        setupCallListeners();
        if (socketCheckInterval.current) {
          clearInterval(socketCheckInterval.current);
        }
      } else {
        console.log('Socket not ready or not connected');
      }
    };

    // Initial check
    checkSocket();

    // Set up interval to check socket
    socketCheckInterval.current = setInterval(checkSocket, 2000);

    return () => {
      if (socketCheckInterval.current) {
        clearInterval(socketCheckInterval.current);
      }
      cleanupCallListeners();
    };
  }, []);

  const setupCallListeners = () => {
    console.log('Setting up call listeners');
    const socket = getSocket();
    
    if (!socket) {
      console.error('Cannot set up listeners - socket not available');
      return;
    }

    // Remove any existing listeners
    removeSocketListener('incomingCall');
    removeSocketListener('callAccepted');
    removeSocketListener('callRejected');
    removeSocketListener('callEnded');

    // Add new listeners
    addSocketListener('incomingCall', handleIncomingCall);
    addSocketListener('callAccepted', handleCallAccepted);
    addSocketListener('callRejected', handleCallRejected);
    addSocketListener('callEnded', handleCallEnded);

    console.log('Call listeners set up successfully');
  };

  const handleIncomingCall = (data) => {
    console.log('Processing incoming call:', data);
    // Only handle calls meant for this user
    if (data.receiverId?.toString() === currentUser?.id?.toString()) {
      setIncomingCallData({
        ...data,
        callerName: data.callerName || otherUser?.name || `User ${data.callerId}`
      });
      setIsIncomingCall(true);
      playRingtone();
    } else {
      console.log('Ignoring call for different user:', data.receiverId);
    }
  };

  const handleCallAccepted = (data) => {
    console.log('Call accepted:', data);
    stopRingtone();
    setIsCallActive(true);
  };

  const handleCallRejected = (data) => {
    console.log('Call rejected:', data);
    stopRingtone();
    setIsCallActive(false);
    setIsIncomingCall(false);
  };

  const handleCallEnded = (data) => {
    console.log('Call ended:', data);
    stopRingtone();
    setIsCallActive(false);
    setIsIncomingCall(false);
    onEndCall?.();
  };

  const cleanupCallListeners = () => {
    console.log('Cleaning up call listeners');
    stopRingtone();
    if (audioRef.current) {
      audioRef.current.unloadAsync().catch(console.warn);
    }
  };

  const requestPermissions = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Audio permission is required for calls');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startCall = async () => {
    if (isLoading) {
      Alert.alert('Please wait', 'Loading user information...');
      return;
    }

    if (!isSocketReady) {
      Alert.alert('Not Ready', 'Please wait while we connect to the call service...');
      return;
    }

    if (!currentUser?.id || !otherUser?.id) {
      console.error('Missing user data:', { currentUser, otherUser });
      Alert.alert('Error', 'Unable to start call - missing user information');
      return;
    }

    console.log('Starting call with data:', { 
      chatId, 
      receiverId,
      caller: currentUser,
      receiver: otherUser
    });

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const callData = {
        chatId,
        callerId: currentUser.id.toString(),
        callerName: currentUser.name,
        receiverId: otherUser.id.toString(),
        receiverName: otherUser.name,
        timestamp: Date.now()
      };

      console.log('Initiating call with data:', callData);
      initiateCall(callData);
      setIsCallActive(true);
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call');
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCallData) {
      console.error('No incoming call data available');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const acceptData = {
        chatId,
        callerId: incomingCallData.callerId,
        callerName: incomingCallData.callerName,
        receiverId: currentUser.id.toString(),
        receiverName: currentUser.name
      };

      console.log('Accepting call with data:', acceptData);
      stopRingtone();
      acceptCall(acceptData);
      setIsCallActive(true);
      setIsIncomingCall(false);
    } catch (error) {
      console.error('Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const handleRejectCall = () => {
    if (!incomingCallData) {
      console.error('No incoming call data available');
      return;
    }

    const rejectData = {
      chatId,
      callerId: incomingCallData.callerId,
      callerName: incomingCallData.callerName,
      receiverId: currentUser.id.toString(),
      receiverName: currentUser.name
    };

    console.log('Rejecting call with data:', rejectData);
    stopRingtone();
    rejectCall(rejectData);
    setIsIncomingCall(false);
  };

  const handleEndCall = () => {
    if (!isSocketReady) {
      console.warn('Socket not ready, cannot end call');
      return;
    }

    const endData = {
      chatId,
      callerId: currentUser.id.toString(),
      callerName: currentUser.name,
      receiverId: otherUser.id.toString(),
      receiverName: otherUser.name
    };

    console.log('Ending call with data:', endData);
    stopRingtone();
    endCall(endData);
    setIsCallActive(false);
    setIsIncomingCall(false);
    onEndCall?.();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      if (!isMuted) {
        audioRef.current.pauseAsync().catch(console.warn);
      } else {
        audioRef.current.resumeAsync().catch(console.warn);
      }
    }
  };

  return (
    <View style={styles.container}>
      <IncomingCallModal
        visible={isIncomingCall}
        callerName={incomingCallData?.callerName}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      {isCallActive ? (
        <View style={styles.activeCallContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <Ionicons
              name="call"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      ) : !isIncomingCall && (
        <TouchableOpacity
          style={styles.startCallButton}
          onPress={startCall}
          disabled={isLoading || !isSocketReady}
        >
          <Ionicons
            name="call"
            size={24}
            color="#082631"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  endCallButton: {
    backgroundColor: '#FF4444',
    transform: [{ rotate: '135deg' }],
  },
  startCallButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default AudioCall;
