import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useContacts } from '@/context/ContactContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CallScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const { contacts } = useContacts();
  const [callStatus, setCallStatus] = useState<'ringing' | 'active' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(type === 'video');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const contact = contacts.find((c) => c._id === id);
  const isVideoCall = type === 'video';

  useEffect(() => {
    // Simulate call answering after 3 seconds
    const timeout = setTimeout(() => {
      setCallStatus('active');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (callStatus === 'active') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  useEffect(() => {
    // Pulse animation for ringing
    if (callStatus === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => router.back(), 1000);
  };

  if (!contact) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text>Contact not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-b from-primary to-secondary">
      <LinearGradient
        colors={['#006FEE', '#7828C8']}
        className="flex-1"
      >
        {/* Top Info */}
        <View className="flex-1 justify-center items-center px-6">
          {callStatus === 'ringing' && (
            <Animated.View
              style={{ transform: [{ scale: pulseAnim }] }}
              className="mb-8"
            >
              <View className="w-32 h-32 rounded-full bg-white/30 justify-center items-center">
                <View className="w-28 h-28 rounded-full bg-white justify-center items-center">
                  <Text className="text-5xl font-bold text-primary">
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {callStatus === 'active' && (
            <View className="w-32 h-32 rounded-full bg-white/30 justify-center items-center mb-8">
              <View className="w-28 h-28 rounded-full bg-white justify-center items-center">
                <Text className="text-5xl font-bold text-primary">
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          <Text className="text-3xl font-bold text-white mb-2">
            {contact.name}
          </Text>

          <Text className="text-xl text-white/80 mb-1">
            {contact.phone}
          </Text>

          <Text className="text-lg text-white/60">
            {callStatus === 'ringing' && `${isVideoCall ? 'Video' : 'Voice'} calling...`}
            {callStatus === 'active' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
          </Text>
        </View>

        {/* Controls */}
        <View className="pb-12 px-6">
          {callStatus === 'active' && (
            <View className="flex-row justify-center gap-6 mb-8">
              {/* Mute */}
              <TouchableOpacity
                onPress={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full justify-center items-center ${
                  isMuted ? 'bg-white' : 'bg-white/30'
                }`}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={28}
                  color={isMuted ? '#006FEE' : 'white'}
                />
              </TouchableOpacity>

              {/* Speaker */}
              <TouchableOpacity
                onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-16 h-16 rounded-full justify-center items-center ${
                  isSpeakerOn ? 'bg-white' : 'bg-white/30'
                }`}
              >
                <Ionicons
                  name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={28}
                  color={isSpeakerOn ? '#006FEE' : 'white'}
                />
              </TouchableOpacity>

              {/* Video Toggle (only for video calls) */}
              {isVideoCall && (
                <TouchableOpacity
                  onPress={() => setIsVideoOn(!isVideoOn)}
                  className={`w-16 h-16 rounded-full justify-center items-center ${
                    !isVideoOn ? 'bg-white' : 'bg-white/30'
                  }`}
                >
                  <Ionicons
                    name={isVideoOn ? 'videocam' : 'videocam-off'}
                    size={28}
                    color={!isVideoOn ? '#006FEE' : 'white'}
                  />
                </TouchableOpacity>
              )}

              {/* Add User */}
              <TouchableOpacity
                className="w-16 h-16 rounded-full bg-white/30 justify-center items-center"
              >
                <Ionicons name="person-add" size={28} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* End Call Button */}
          <View className="items-center">
            <TouchableOpacity
              onPress={handleEndCall}
              className="w-20 h-20 rounded-full bg-danger justify-center items-center"
            >
              <Ionicons name="call" size={36} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
