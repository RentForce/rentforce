import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Vibration,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { 
  initiateVideoCall, 
  acceptVideoCall, 
  rejectVideoCall, 
  endVideoCall,
  addSocketListener,
  removeSocketListener,
  getSocket 
} from '../Socket';
import IncomingCallModal from './IncomingCallModal';

const VideoCall = ({ 
  chatId, 
  receiverId, 
  onEndCall, 
  otherUser,
  currentUser 
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [roomName, setRoomName] = useState('');
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
        Vibration.vibrate([500, 1000, 500, 1000], true);
      }
    } catch (error) {
      console.warn('Could not play ringtone:', error);
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
    console.log('VideoCall props:', {
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

  // Socket setup
  useEffect(() => {
    console.log('Setting up video call socket listeners...', { currentUser, otherUser });
    
    const setupListeners = () => {
      const socket = getSocket();
      if (socket && socket.connected) {
        console.log('Socket is ready and connected, setting up listeners');
        setIsSocketReady(true);

        // Add event listeners
        addSocketListener('incomingVideoCall', handleIncomingCall);
        addSocketListener('videoCallAccepted', handleCallAccepted);
        addSocketListener('videoCallRejected', handleCallRejected);
        addSocketListener('videoCallEnded', handleCallEnded);

        console.log('Video call listeners set up successfully');
      } else {
        console.log('Socket not ready or not connected');
        setIsSocketReady(false);
      }
    };

    // Initial setup
    setupListeners();

    // Check connection periodically
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket && !socket.connected) {
        console.log('Socket disconnected, attempting to reconnect...');
        setupListeners();
      }
    }, 5000);

    // Cleanup
    return () => {
      console.log('Cleaning up video call socket listeners...');
      clearInterval(interval);
      removeSocketListener('incomingVideoCall', handleIncomingCall);
      removeSocketListener('videoCallAccepted', handleCallAccepted);
      removeSocketListener('videoCallRejected', handleCallRejected);
      removeSocketListener('videoCallEnded', handleCallEnded);
    };
  }, [currentUser?.id]);

  const startCall = async () => {
    console.log('Starting video call...', {
      currentUser,
      receiverId,
      chatId,
      isSocketReady,
      isLoading
    });

    if (isLoading || !isSocketReady) {
      Alert.alert('Cannot start call', 'Please wait while we connect to the server.');
      return;
    }

    const roomId = `rentforce_${Math.min(currentUser.id, receiverId)}_${Math.max(currentUser.id, receiverId)}_${Date.now()}`;
    console.log('Generated room ID:', roomId);
    setRoomName(roomId);

    const callData = {
      callerId: currentUser.id,
      callerName: currentUser.name,
      receiverId: receiverId,
      chatId: chatId,
      roomName: roomId
    };
    
    console.log('Initiating video call with data:', callData);
    initiateVideoCall(callData);
    setIsCallActive(true);

    // Open Jitsi Meet for the caller immediately
    await openJitsiMeet(roomId);
  };

  const openJitsiMeet = async (roomId) => {
    try {
      console.log('Opening Jitsi Meet for room:', roomId);
      const jitsiUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"`;
      console.log('Opening Jitsi Meet URL:', jitsiUrl);
      
      const canOpen = await Linking.canOpenURL(jitsiUrl);
      if (canOpen) {
        await Linking.openURL(jitsiUrl);
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('Error opening Jitsi Meet:', error);
      Alert.alert(
        'Error',
        'Could not open Jitsi Meet. Please make sure you have a compatible browser installed.',
        [{ text: 'OK' }]
      );
      // Reset call state if we can't open Jitsi
      setIsCallActive(false);
      handleEndCall();
    }
  };

  const handleIncomingCall = (data) => {
    console.log('Processing incoming video call:', data);
    if (data.receiverId?.toString() === currentUser?.id?.toString()) {
      setIncomingCallData({
        ...data,
        callerName: data.callerName || `User ${data.callerId}`,
        roomName: data.roomName
      });
      setIsIncomingCall(true);
      playRingtone();
    } else {
      console.log('Ignoring call for different user:', data.receiverId);
    }
  };

  const handleCallAccepted = async (data) => {
    console.log('Video call accepted:', data);
    stopRingtone();
    setIsCallActive(true);
    setIsIncomingCall(false);

    // Join the Jitsi room
    if (data.roomName) {
      await openJitsiMeet(data.roomName);
    } else {
      console.error('No room name provided in accepted call data');
    }
  };

  const handleAcceptCall = async () => {
    console.log('Accepting video call with data:', incomingCallData);
    if (!incomingCallData) return;

    const acceptData = {
      callerId: incomingCallData.callerId,
      receiverId: currentUser.id,
      chatId: chatId,
      roomName: incomingCallData.roomName
    };

    acceptVideoCall(acceptData);
    setIsCallActive(true);
    setIsIncomingCall(false);
    stopRingtone();

    // Join the Jitsi room
    if (incomingCallData.roomName) {
      await openJitsiMeet(incomingCallData.roomName);
    } else {
      console.error('No room name in incoming call data');
    }
  };

  const handleRejectCall = () => {
    console.log('Rejecting video call');
    if (!incomingCallData) return;

    rejectVideoCall({
      callerId: incomingCallData.callerId,
      receiverId: currentUser.id,
      chatId: chatId
    });
    setIsIncomingCall(false);
    stopRingtone();
  };

  const handleCallRejected = (data) => {
    console.log('Video call rejected:', data);
    stopRingtone();
    setIsCallActive(false);
    setIsIncomingCall(false);
    Alert.alert('Call Rejected', 'The other user rejected the video call.');
  };

  const handleCallEnded = (data) => {
    console.log('Video call ended:', data);
    stopRingtone();
    setIsCallActive(false);
    setIsIncomingCall(false);
    onEndCall?.();
  };

  const handleEndCall = () => {
    console.log('Ending video call');
    endVideoCall({
      callerId: currentUser.id,
      receiverId: receiverId,
      chatId: chatId
    });
    setIsCallActive(false);
    onEndCall?.();
  };

  return (
    <View style={styles.container}>
      {!isCallActive && !isIncomingCall && (
        <TouchableOpacity
          style={styles.startCallButton}
          onPress={startCall}
          disabled={isLoading || !isSocketReady}
        >
          <Ionicons
            name="videocam"
            size={24}
            color="#082631"
          />
        </TouchableOpacity>
      )}

      {isCallActive && (
        <TouchableOpacity
          style={[styles.startCallButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="close-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}

      <IncomingCallModal
        visible={isIncomingCall}
        callerName={incomingCallData?.callerName || 'Unknown'}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        callType="video"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCallButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  endCallButton: {
    backgroundColor: '#FFE5E5',
  },
});

export default VideoCall;
