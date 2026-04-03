import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get("window");

const VIDEO_DURATION_MS = 3000;

function FullscreenVideo({ onReady }: { onReady?: () => void }) {
    if (Platform.OS === 'web') {
        return (
            <video
                src={require("@/assets/images/video/onboarding.mp4")}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                }}
                autoPlay
                muted
                playsInline
                onCanPlay={onReady}
            />
        );
    }

    return (
        <Video
            source={require("@/assets/images/video/onboarding.mp4")}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            onReadyForDisplay={onReady}
            onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded && status.didJustFinish) {
                    onReady?.();
                }
            }}
        />
    );
}

export default function OnboardingScreen() {
    const [buttonsVisible, setButtonsVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const handleNext = () => router.push('/paywall');
    const handleSignIn = () => router.push('/(auth)/login');


    const handleVideoReady = () => {
        if (buttonsVisible) return; // prevent double-trigger
        setButtonsVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar hidden />

            <View style={styles.container}>
                <FullscreenVideo onReady={handleVideoReady} />

                {/* Sign In Button — slides down from top */}
                {buttonsVisible && (
                    <Animated.View
                        style={[
                            styles.signInWrapper,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: Animated.multiply(slideAnim, -1) }],
                            },
                        ]}
                    >
                        <TouchableOpacity onPress={handleSignIn}>
                            <Text style={styles.signInText}>Sign in</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Next Button — slides up from bottom */}
                {buttonsVisible && (
                    <Animated.View
                        style={[
                            styles.nextWrapper,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.nextCircle}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-forward" size={26} color="#fff" />                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
    },
    signInWrapper: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 58 : 40,
        right: 20,
        zIndex: 10,
    },
    signInText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    nextWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 40,
        left: width / 2 - 30,
        zIndex: 10,
    },
    nextCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8001C',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
    },
});