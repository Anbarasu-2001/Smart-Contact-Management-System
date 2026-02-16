import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { TextField } from 'heroui-native/text-field';
import { Label } from 'heroui-native/label';
import { Description } from 'heroui-native/description';
import { Card } from 'heroui-native/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            // Navigation handled by root layout
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Unable to create account');
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
                        Create Account
                    </Text>
                    <Text className="text-center text-foreground opacity-60">
                        Sign up to get started
                    </Text>
                </View>

                <Card className="p-6">
                    <View className="gap-4">
                        <TextField isRequired>
                            <Label>Full Name</Label>
                            <Input
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </TextField>

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
                            <Description>Password must be at least 6 characters</Description>
                        </TextField>

                        <TextField isRequired>
                            <Label>Confirm Password</Label>
                            <Input
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </TextField>

                        <Button
                            onPress={handleRegister}
                            isDisabled={loading}
                            className="mt-4"
                            size="lg"
                            variant='primary'
                        >
                            <Button.Label>
                                {loading ? 'Signing Up...' : 'Sign Up'}
                            </Button.Label>
                        </Button>

                        <View className="flex-row justify-center items-center mt-4">
                            <Text className="text-default-500">Already have an account? </Text>
                            <Button
                                variant="ghost"
                                onPress={() => router.push('/login')}
                                size="sm"
                            >
                                <Button.Label>Sign In</Button.Label>
                            </Button>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
