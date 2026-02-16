import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native';
import { Input } from 'heroui-native/input';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { useAuth } from '@/context/AuthContext';
import { useContacts } from '@/context/ContactContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { contacts, getContacts, loading, filterContacts, clearFilter, deleteContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [themeColorDefaultForeground] = useThemeColor(['default-foreground']);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated]);

  const loadContacts = async () => {
    try {
      await getContacts();
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      filterContacts(text);
    } else {
      clearFilter();
    }
  };

  const handleDeleteContact = (id: string, name: string) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContact(id),
        },
      ]
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-primary">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-primary-foreground">
              My Contacts
            </Text>
            <Text className="text-primary-foreground opacity-80">
              {contacts.length} contacts
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="bg-white/20 p-3 rounded-full"
          >
            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={handleSearch}
          className="bg-white dark:bg-content1"
        />
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && contacts.length === 0 ? (
          <View className="mt-20">
            <Text className="text-center text-default-500">Loading contacts...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View className="mt-20 items-center">
            <Ionicons name="people-outline" size={80} color="#ccc" />
            <Text className="text-xl text-center text-default-500 mt-4">
              No contacts yet
            </Text>
            <Text className="text-center text-default-400 mt-2 px-8">
              Add your first contact to get started
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-6">
            {contacts.map((contact) => (
              <Card key={contact._id} className="p-4">
                <TouchableOpacity
                  onPress={() => router.push(`/contact/${contact._id}`)}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-12 h-12 rounded-full bg-primary justify-center items-center">
                          <Text className="text-white text-xl font-bold">
                            {contact.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-foreground">
                            {contact.name}
                          </Text>
                          <Text className="text-sm text-default-500">
                            {contact.phone}
                          </Text>
                        </View>
                      </View>

                      {contact.purpose && (
                        <Text className="text-sm text-default-600 mb-2">
                          {contact.purpose}
                        </Text>
                      )}

                      <View className="flex-row gap-2 flex-wrap">
                        {contact.priority && (
                          <Chip
                            size="sm"
                            color={getPriorityColor(contact.priority)}
                            variant="flat"
                          >
                            {contact.priority}
                          </Chip>
                        )}
                        {contact.category && (
                          <Chip size="sm" variant="flat">
                            {contact.category}
                          </Chip>
                        )}
                        {contact.relationshipScore !== undefined && (
                          <Chip size="sm" color="secondary" variant="flat">
                            Score: {contact.relationshipScore}
                          </Chip>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => router.push(`/chat/${contact._id}`)}
                      className="flex-1"
                    >
                      <Ionicons name="chatbubble" size={16} color={themeColorDefaultForeground} />
                      <Button.Label>Chat</Button.Label>
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => router.push(`/call/${contact._id}?type=voice`)}
                      className="flex-1"
                    >
                      <Ionicons name="call" size={16} color={themeColorDefaultForeground} />
                      <Button.Label>Call</Button.Label>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => router.push(`/call/${contact._id}?type=video`)}
                      className="flex-1"
                    >
                      <Ionicons name="videocam" size={16} color={themeColorDefaultForeground} />
                      <Button.Label>Video</Button.Label>
                    </Button>
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/contact/new')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
