import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const VoiceRecorder = ({ onRecordComplete }) => {
    const [recording, setRecording] = useState(null);
    const [sound, setSound] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingUri, setRecordingUri] = useState(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    const formatDuration = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            // Reset states
            setRecordingUri(null);
            setIsPreviewMode(false);
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission required', 'Please grant microphone permission');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                (status) => {
                    setRecordingDuration(status.durationMillis || 0);
                },
                100
            );

            setRecording(newRecording);
            setIsRecording(true);

        } catch (err) {
            console.error('Failed to start recording:', err);
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        try {
            if (!recording) {
                console.log('No recording to stop');
                return;
            }

            console.log('Stopping recording...');
            setIsRecording(false);
            
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped, URI:', uri);

            if (!uri) {
                throw new Error('No recording URI available');
            }

            setRecordingUri(uri);
            setRecording(null);
            setIsPreviewMode(true);

            // Load the recording for preview
            await loadRecordingForPreview(uri);

        } catch (err) {
            console.error('Failed to stop recording:', err);
            Alert.alert('Error', 'Failed to stop recording');
        }
    };

    const loadRecordingForPreview = async (uri) => {
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
        } catch (error) {
            console.error('Error loading sound:', error);
        }
    };

    const onPlaybackStatusUpdate = (status) => {
        if (status.didJustFinish) {
            setIsPlaying(false);
        }
    };

    const handlePlayPause = async () => {
        try {
            if (!sound) return;

            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing/pausing:', error);
        }
    };

    const handleSend = () => {
        if (recordingUri) {
            onRecordComplete(recordingUri);
            // Reset states
            setRecordingUri(null);
            setIsPreviewMode(false);
            setRecordingDuration(0);
            if (sound) {
                sound.unloadAsync();
                setSound(null);
            }
        }
    };

    const handleCancel = async () => {
        setIsPreviewMode(false);
        setRecordingUri(null);
        setRecordingDuration(0);
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }
    };

    if (isPreviewMode) {
        return (
            <View style={styles.previewContainer}>
                <View style={styles.previewControls}>
                    <TouchableOpacity
                        onPress={handlePlayPause}
                        style={styles.playButton}
                    >
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={24}
                            color="#007AFF"
                        />
                    </TouchableOpacity>
                    <Text style={styles.durationText}>
                        {formatDuration(recordingDuration)}
                    </Text>
                </View>
                <View style={styles.previewActions}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                        <Ionicons name="send" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={[styles.button, isRecording ? styles.recording : null]}
            >
                <Ionicons
                    name={isRecording ? "mic" : "mic-outline"}
                    size={24}
                    color={isRecording ? "#ff0000" : "#000000"}
                />
                <Text style={styles.buttonText}>
                    {isRecording ? formatDuration(recordingDuration) : 'Record'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    recording: {
        backgroundColor: '#ffe0e0',
    },
    buttonText: {
        marginLeft: 5,
        fontSize: 14,
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        padding: 8,
        marginRight: 10,
        justifyContent: 'space-between',
    },
    previewControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    durationText: {
        fontSize: 14,
        color: '#666666',
    },
    previewActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButton: {
        marginRight: 10,
        padding: 5,
    },
    cancelText: {
        color: '#ff3b30',
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VoiceRecorder;