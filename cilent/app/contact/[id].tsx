import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { TextField } from 'heroui-native/text-field';
import { Label } from 'heroui-native/label';
import { Card } from 'heroui-native/card';
import { useContacts } from '@/context/ContactContext';
import { Contact } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function ContactDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { contacts, current, addContact, updateContact, setCurrent, clearCurrent } = useContacts();

    const [formData, setFormData] = useState<Contact>({
        name: '',
        phone: '',
        purpose: '',
        priority: 'Medium',
        category: 'Other',
        notes: '',
        howMet: '',
        relationshipScore: 0,
    });
    const [loading, setLoading] = useState(false);
    const isNewContact = id === 'new';

    useEffect(() => {
        if (!isNewContact && id) {
            const contact = contacts.find((c) => c._id === id);
            if (contact) {
                setFormData(contact);
                setCurrent(contact);
            }
        }
        return () => clearCurrent();
    }, [id]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            Alert.alert('Error', 'Please fill in name and phone number');
            return;
        }

        setLoading(true);
        try {
            if (isNewContact) {
                await addContact(formData);
                Alert.alert('Success', 'Contact added successfully');
            } else {
                await updateContact(formData);
                Alert.alert('Success', 'Contact updated successfully');
            }
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView className="flex-1 px-6 py-6">
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-foreground">
                        {isNewContact ? 'Add New Contact' : 'Edit Contact'}
                    </Text>
                </View>

                <Card className="p-6 mb-6">
                    <View className="gap-4">
                        {/* Avatar */}
                        <View className="items-center mb-4">
                            <View className="w-24 h-24 rounded-full bg-primary justify-center items-center">
                                <Text className="text-white text-4xl font-bold">
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                                </Text>
                            </View>
                        </View>

                        {/* Basic Info */}
                        <TextField isRequired>
                            <Label>Full Name</Label>
                            <Input
                                placeholder="Enter full name"
                                value={formData.name}
                                onChangeText={(value) => setFormData({ ...formData, name: value })}
                            />
                        </TextField>

                        <TextField isRequired>
                            <Label>Phone Number</Label>
                            <Input
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                                keyboardType="phone-pad"
                            />
                        </TextField>

                        <TextField>
                            <Label>Purpose</Label>
                            <Input
                                placeholder="e.g., Client, Friend, Family"
                                value={formData.purpose}
                                onChangeText={(value) => setFormData({ ...formData, purpose: value })}
                            />
                        </TextField>

                        {/* Priority Selector */}
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Priority
                            </Text>
                            <View className="flex-row gap-2">
                                {(['High', 'Medium', 'Low'] as const).map((priority) => (
                                    <Button
                                        key={priority}
                                        onPress={() => setFormData({ ...formData, priority })}
                                        variant={formData.priority === priority ? 'primary' : 'outline'}
                                        className="flex-1"
                                    >
                                        <Button.Label>{priority}</Button.Label>
                                    </Button>
                                ))}
                            </View>
                        </View>

                        {/* Category Selector */}
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Category
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {(['Family', 'Friend', 'Work', 'Business', 'Other'] as const).map((category) => (
                                    <Button
                                        key={category}
                                        onPress={() => setFormData({ ...formData, category })}
                                        variant={formData.category === category ? 'primary' : 'outline'}
                                        size="sm"
                                    >
                                        <Button.Label>{category}</Button.Label>
                                    </Button>
                                ))}
                            </View>
                        </View>

                        {/* How Met */}
                        <TextField>
                            <Label>How Did You Meet?</Label>
                            <Input
                                placeholder="e.g., College, Conference, Mutual friend"
                                value={formData.howMet}
                                onChangeText={(value) => setFormData({ ...formData, howMet: value })}
                            />
                        </TextField>

                        {/* Notes */}
                        <TextField>
                            <Label>Notes</Label>
                            <Input
                                placeholder="Add any additional notes..."
                                value={formData.notes}
                                onChangeText={(value) => setFormData({ ...formData, notes: value })}
                                multiline
                                numberOfLines={3}
                            />
                        </TextField>

                        {/* Relationship Score */}
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Relationship Score: {formData.relationshipScore}
                            </Text>
                            <View className="flex-row gap-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                    <Button
                                        key={score}
                                        onPress={() => setFormData({ ...formData, relationshipScore: score })}
                                        variant={
                                            formData.relationshipScore !== undefined && formData.relationshipScore >= score
                                                ? 'danger'
                                                : 'primary'
                                        }
                                        size="sm"
                                        className="flex-1 min-w-0"
                                    >
                                        <Button.Label className="text-xs">{score}</Button.Label>
                                    </Button>
                                ))}
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-6">
                    <Button
                        onPress={() => router.back()}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                    >
                        <Button.Label>Cancel</Button.Label>
                    </Button>
                    <Button
                        onPress={handleSubmit}
                        variant="primary"
                        isDisabled={loading}
                        className="flex-1"
                        size="lg"
                    >
                        <Button.Label>
                            {isNewContact ? 'Add Contact' : 'Update Contact'}
                        </Button.Label>
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
