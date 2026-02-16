import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native';
import { Card } from 'heroui-native/card';
import { useAuth } from '@/context/AuthContext';
import { useContacts } from '@/context/ContactContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { user, logout, isAuthenticated } = useAuth();
    const { contacts } = useContacts();
    const router = useRouter();
    const [themeColorAccentForeground, themeColorDefaultForeground, themeColorDangerForeground] = useThemeColor([
        'accent-foreground',
        'default-foreground',
        'danger-foreground',
    ]);

    React.useEffect(() => {
        // Auth check handled by root layout
    }, [isAuthenticated]);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        // Navigation handled by root layout
                    },
                },
            ]
        );
    };

    if (!user) return null;

    const stats = [
        { label: 'Contacts', value: contacts.length, icon: 'people', color: '#006FEE' },
        { label: 'High Priority', value: contacts.filter(c => c.priority === 'High').length, icon: 'alert-circle', color: '#F31260' },
        { label: 'Categories', value: new Set(contacts.map(c => c.category)).size, icon: 'file-tray-stacked', color: '#17C964' },
    ];

    const menuItems = [
        { icon: 'person-outline', label: 'Edit Profile', screen: '/profile/edit' },
        { icon: 'settings-outline', label: 'Settings', screen: '/settings' },
        { icon: 'notifications-outline', label: 'Notifications', screen: '/notifications' },
        { icon: 'shield-checkmark-outline', label: 'Privacy', screen: '/privacy' },
        { icon: 'help-circle-outline', label: 'Help & Support', screen: '/help' },
        { icon: 'information-circle-outline', label: 'About', screen: '/about' },
    ];

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 pt-12 pb-6 bg-primary">
                <View className="items-center">
                    <View className="w-24 h-24 rounded-full bg-white justify-center items-center mb-4">
                        <Text className="text-primary text-4xl font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-primary-foreground mb-1">
                        {user.name}
                    </Text>
                    <Text className="text-primary-foreground opacity-80">
                        {user.email}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
                {/* Stats Cards */}
                <View className="flex-row gap-3 mb-6">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="flex-1 p-4">
                            <View className="items-center">
                                <View
                                    className="w-12 h-12 rounded-full justify-center items-center mb-2"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                                </View>
                                <Text className="text-2xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </Text>
                                <Text className="text-xs text-default-500">
                                    {stat.label}
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>

                {/* Quick Actions */}
                <Card className="p-4 mb-6">
                    <Text className="text-lg font-semibold text-foreground mb-3">
                        Quick Actions
                    </Text>
                    <View className="flex-row gap-2">
                        <Button
                            onPress={() => router.push('/contact/new')}
                            variant="primary"
                            className="flex-1"
                        >
                            <Ionicons name="person-add" size={20} color={themeColorAccentForeground} />
                            <Button.Label>Add Contact</Button.Label>
                        </Button>
                        <Button
                            onPress={() => router.push('/(tabs)')}
                            variant="outline"
                            className="flex-1"
                        >
                            <Ionicons name="search" size={20} color={themeColorDefaultForeground} />
                            <Button.Label>Search</Button.Label>
                        </Button>
                    </View>
                </Card>

                {/* Menu Items */}
                <Card className="mb-6">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.label}
                            onPress={() => {
                                // For now just show alert, in real app would navigate
                                Alert.alert('Coming Soon', `${item.label} feature coming soon!`);
                            }}
                            className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-default-200' : ''
                                }`}
                        >
                            <View className="w-10 h-10 rounded-full bg-default-100 justify-center items-center mr-3">
                                <Ionicons name={item.icon as any} size={20} color="#666" />
                            </View>
                            <Text className="flex-1 text-foreground">
                                {item.label}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Logout Button */}
                <Button
                    onPress={handleLogout}
                    variant="danger"
                    size="lg"
                >
                    <Ionicons name="log-out-outline" size={20} color={themeColorDangerForeground} />
                    <Button.Label>Logout</Button.Label>
                </Button>

                {/* App Version */}
                <Text className="text-center text-default-400 text-sm mt-6">
                    Version 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
