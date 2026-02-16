import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { useContacts } from '@/context/ContactContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { contacts } = useContacts();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const contact = contacts.find((c) => c._id === id);

  useEffect(() => {
    // Load messages for this contact (mock data for now)
    const mockMessages: Message[] = [
      {
        _id: '1',
        contactId: id as string,
        senderId: 'user',
        content: 'Hey! How are you doing?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        read: true,
      },
      {
        _id: '2',
        contactId: id as string,
        senderId: id as string,
        content: "I'm doing great! Thanks for asking. How about you?",
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'text',
        read: true,
      },
      {
        _id: '3',
        contactId: id as string,
        senderId: 'user',
        content: "Doing well! Want to catch up later?",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
        read: true,
      },
    ];
    setMessages(mockMessages);
  }, [id]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        _id: Date.now().toString(),
        contactId: id as string,
        senderId: 'user',
        content: inputText,
        timestamp: new Date().toISOString(),
        type: 'text',
        read: false,
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!contact) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text>Contact not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-primary flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View className="w-10 h-10 rounded-full bg-white justify-center items-center mr-3">
          <Text className="text-primary text-lg font-bold">
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-lg font-semibold text-white">
            {contact.name}
          </Text>
          <Text className="text-sm text-primary-200">
            Online
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/call/${id}?type=voice`)}
          className="mr-3"
        >
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/call/${id}?type=video`)}
        >
          <Ionicons name="videocam" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => {
          const isUser = message.senderId === 'user';
          return (
            <View
              key={message._id}
              className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isUser ? 'bg-primary' : 'bg-default-100'
                }`}
              >
                <Text className={isUser ? 'text-white' : 'text-foreground'}>
                  {message.content}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    isUser ? 'text-primary-200' : 'text-default-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View className="px-4 py-3 bg-default-50 flex-row items-center gap-2">
        <TouchableOpacity className="p-2">
          <Ionicons name="add-circle" size={28} color="#006FEE" />
        </TouchableOpacity>

        <View className="flex-1 bg-white rounded-full px-4 py-2 flex-row items-center">
          <TextInput
            className="flex-1 text-base"
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSend}
          className="bg-primary p-3 rounded-full"
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
