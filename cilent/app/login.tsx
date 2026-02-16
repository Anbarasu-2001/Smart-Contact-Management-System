import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { TextField } from 'heroui-native/text-field';
import { Label } from 'heroui-native/label';
import { Card } from 'heroui-native/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            // Navigation handled by root layout
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerClassName="flex-1 justify-center p-6"
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-8">
                    <Text className="text-4xl font-bold text-center text-primary mb-2">
                        Welcome Back
                    </Text>
                    <Text className="text-center text-foreground opacity-60">
                        Sign in to continue to your contacts
                    </Text>
                </View>

                <Card className="p-6">
                    <View className="gap-4">
                        <TextField isRequired>
                            <Label>Email</Label>
                            <Input
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </TextField>

                        <TextField isRequired>
                            <Label>Password</Label>
                            <Input
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </TextField>

                        <Button
                            onPress={handleLogin}
                            isDisabled={loading}
                            className="mt-4"
                            size="lg"
                            variant='primary'
                        >
                            <Button.Label>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button.Label>
                        </Button>

                        <View className="flex-row justify-center items-center mt-4">
                            <Text className="text-default-500">Don't have an account? </Text>
                            <Button
                                variant="ghost"
                                onPress={() => router.push('/register')}
                                size="sm"
                            >
                                <Button.Label>Sign Up</Button.Label>
                            </Button>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
