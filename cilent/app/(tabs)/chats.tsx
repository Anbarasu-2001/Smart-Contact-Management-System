import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { useAuth } from '@/context/AuthContext';
import { useContacts } from '@/context/ContactContext';
import { Ionicons } from '@expo/vector-icons';

interface ChatPreview {
  contactId: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
}

export default function ChatsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { contacts, getContacts } = useContacts();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock chat data - in real app this would come from API
  const [chats, setChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  const loadChats = async () => {
    await getContacts();
    // Mock chat data based on contacts
    const mockChats: ChatPreview[] = contacts.slice(0, 5).map((contact) => ({
      contactId: contact._id!,
      contactName: contact.name,
      lastMessage: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      unreadCount: Math.floor(Math.random() * 5),
      online: Math.random() > 0.5,
    }));
    setChats(mockChats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-primary">
        <Text className="text-2xl font-bold text-primary-foreground">
          Messages
        </Text>
        <Text className="text-primary-foreground opacity-80">
          {chats.filter(c => c.unreadCount > 0).length} unread conversations
        </Text>
      </View>

      {chats.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <Text className="text-xl text-center text-default-500 mt-4">
            No messages yet
          </Text>
          <Text className="text-center text-default-400 mt-2">
            Start a conversation with your contacts
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.contactId}
              onPress={() => router.push(`/chat/${chat.contactId}`)}
              className="border-b border-default-200"
            >
              <View className="px-6 py-4 flex-row items-center">
                {/* Avatar */}
                <View className="relative mr-4">
                  <View className="w-14 h-14 rounded-full bg-primary justify-center items-center">
                    <Text className="text-white text-xl font-bold">
                      {chat.contactName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {chat.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-white" />
                  )}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {chat.contactName}
                    </Text>
                    <Text className="text-xs text-default-400">
                      {formatTime(chat.timestamp)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-default-500 flex-1"
                      numberOfLines={1}
                    >
                      {chat.lastMessage}
                    </Text>
                    {chat.unreadCount > 0 && (
                      <View className="ml-2 bg-primary w-6 h-6 rounded-full justify-center items-center">
                        <Text className="text-white text-xs font-bold">
                          {chat.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
