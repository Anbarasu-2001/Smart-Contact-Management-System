'use client';

import React, { useState, useContext, useEffect } from 'react';
import { ContactContext, Contact } from '../../context/contact/ContactContext';
import { AlertContext } from '../../context/alert/AlertContext';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';

interface ContactFormProps {
    onSaved?: () => void;
    onCancel?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSaved, onCancel }) => {
    const contactContext = useContext(ContactContext);
    const alertContext = useContext(AlertContext);

    const { addContact, updateContact, clearCurrent, current, error } = contactContext || {};
    const { setAlert } = alertContext || {};

    const [contact, setContact] = useState({
        name: '',
        email: '',
        phone: '',
        relationshipType: 'friend' as 'friend' | 'family' | 'work',
        notes: '',
        type: 'personal' as 'personal' | 'professional',
    });
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const relationshipOptions = [
        { key: 'friend', label: 'Friend', icon: 'fa-user-group' },
        { key: 'family', label: 'Family', icon: 'fa-house-user' },
        { key: 'work', label: 'Work', icon: 'fa-briefcase' },
    ] as const;



    const normalizeRelationshipForForm = (value?: string) => {
        const normalized = String(value || '').toLowerCase();
        if (normalized === 'family') return 'family';
        if (normalized === 'work' || normalized === 'colleague' || normalized === 'client') return 'work';
        return 'friend';
    };

    useEffect(() => {
        if (current) {
            setContact({
                name: current.name || '',
                email: current.email || '',
                phone: current.phone || '',
                relationshipType: normalizeRelationshipForForm(current.relationshipType || current.relationship) as any,
                notes: current.notes || '',
                type: current.type || 'personal',
            });
        } else {
            setContact({
                name: '',
                email: '',
                phone: '',
                relationshipType: 'friend',
                notes: '',
                type: 'personal',
            });
        }
        setFormError('');
    }, [current]);

    useEffect(() => {
        if (error && setAlert) {
            setAlert(error, 'danger');
        }
    }, [error, setAlert]);

    const { name, email, phone } = contact;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setContact({ ...contact, [e.target.name]: e.target.value });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName || !trimmedPhone) {
            setFormError('Name and phone are required.');
            return;
        }

        setFormError('');
        setIsSaving(true);

        const payload: Contact = {
            ...(current?._id ? { _id: current._id } : {}),
            name: trimmedName,
            phone: trimmedPhone,
            email: email.trim().toLowerCase(),
            relationshipType: contact.relationshipType as any,
            relationship: contact.relationshipType === 'family' ? 'Family' : contact.relationshipType === 'work' ? 'Work' : 'Friend',
            notes: contact.notes.trim(),
            type: current?.type || 'personal',
        };

        let saved: Contact | null = null;

        if (current?._id && updateContact) {
            saved = await updateContact(payload);
        } else {
            saved = addContact ? await addContact(payload) : null;
        }

        setIsSaving(false);

        if (!saved) return;

        setAlert?.(current ? '✅ Contact updated' : '✅ Contact Added', 'success');
        clearAll();
        onSaved?.();
    };

    const clearAll = () => {
        if (clearCurrent) clearCurrent();
        setContact({
            name: '',
            email: '',
            phone: '',
            relationshipType: 'friend',
            notes: '',
            type: 'personal',
        });
        setFormError('');
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    {current ? 'Edit Contact' : 'Add Contact'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Save contacts for chat and call instantly.</p>
            </div>

            {formError && (
                <div className="rounded-xl border border-rose-200/50 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-900/20 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <i className="fas fa-exclamation-circle" />
                    <p>{formError}</p>
                </div>
            )}

            <div className="flex flex-col gap-6">
                <Input
                    label="Name"
                    placeholder="Enter full name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                    variant="faded"
                    classNames={{
                        inputWrapper: "bg-slate-50 dark:bg-slate-900/50",
                    }}
                />
                <Input
                    label="Phone Number"
                    placeholder="Enter active phone number"
                    name="phone"
                    value={phone}
                    onChange={onChange}
                    required
                    variant="faded"
                    classNames={{
                        inputWrapper: "bg-slate-50 dark:bg-slate-900/50",
                    }}
                />
                <Input
                    label="Email"
                    placeholder="Used for app linking"
                    name="email"
                    value={email}
                    onChange={onChange}
                    type="email"
                    variant="faded"
                    classNames={{
                        inputWrapper: "bg-slate-50 dark:bg-slate-900/50",
                    }}
                />

                <div className="pt-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Relationship Label</p>
                    <div className="grid grid-cols-3 gap-3">
                        {relationshipOptions.map((option) => {
                            const isSelected = contact.relationshipType === option.key;
                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={`relative overflow-hidden rounded-xl border px-3 py-2.5 text-sm font-medium flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
 isSelected
 ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 shadow-sm shadow-cyan-500/10 -translate-y-0.5'
 : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900/30 dark:text-slate-400 dark:hover:bg-slate-900/60'
 }`}
                                    onClick={() => setContact({ ...contact, relationshipType: option.key as any })}
                                >
                                    <i className={`fas ${option.icon} ${isSelected ? 'scale-110' : 'opacity-80'} transition-transform`} />
                                    <span>{option.label}</span>
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-1">
                    <Textarea
                        label="Notes"
                        placeholder="Add some notes about this contact..."
                        name="notes"
                        value={contact.notes}
                        onChange={onChange}
                        variant="faded"
                        minRows={3}
                        classNames={{
                            inputWrapper: "bg-slate-50 dark:bg-slate-900/50",
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                    type="button"
                    variant="light"
                    className="font-medium text-slate-600 dark:text-slate-400"
                    onPress={() => {
                        clearAll();
                        setFormError('');
                        onCancel?.();
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    isLoading={isSaving} 
                    className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30"
                >
                    {current ? 'Save Changes' : 'Save Contact'}
                </Button>
            </div>
        </form>
    );
};

export default ContactForm;
