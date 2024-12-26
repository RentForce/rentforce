import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const AudioMessage = ({ audioUrl, isOwnMessage }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const loadAudio = async () => {
        try {
            setIsLoading(true);
            const { sound: audioSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            setSound(audioSound);

            // Get duration
            const status = await audioSound.getStatusAsync();
            setDuration(status.durationMillis);
        } catch (error) {
            console.error('Error loading audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAudio();
    }, [audioUrl]);

    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
            }
        }
    };

    const handlePlayPause = async () => {
        try {
            if (!sound) return;

            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                if (position === duration) {
                    await sound.setPositionAsync(0);
                }
                await sound.playAsync();
            }
        } catch (error) {
            console.error('Error playing/pausing audio:', error);
        }
    };

    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[
            styles.container,
            isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}>
            <TouchableOpacity
                onPress={handlePlayPause}
                style={styles.playButton}
                disabled={isLoading}
            >
                <Ionicons
                    name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
                    size={24}
                    color={isOwnMessage ? '#FFFFFF' : '#007AFF'}
                />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
                <View style={styles.waveform}>
                    <View style={[
                        styles.progressBar,
                        {
                            width: `${(position / duration) * 100}%`,
                            backgroundColor: isOwnMessage ? '#FFFFFF' : '#007AFF'
                        }
                    ]} />
                </View>
                <Text style={[
                    styles.duration,
                    { color: isOwnMessage ? '#FFFFFF' : '#666666' }
                ]}>
                    {formatTime(position)} / {formatTime(duration)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 24,
        maxWidth: 280,
        minWidth: 220,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    ownMessage: {
        backgroundColor: '#4361EE',
        alignSelf: 'flex-end',
        marginLeft: 50,
    },
    otherMessage: {
        backgroundColor: '#F8F9FA',
        alignSelf: 'flex-start',
        marginRight: 50,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    progressContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    waveform: {
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 6,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4361EE',
        transition: 'width 0.1s ease-in-out',
    },
    duration: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.3,
        opacity: 0.9,
    }
});

export default AudioMessage;