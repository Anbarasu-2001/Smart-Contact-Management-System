'use client';

import React, { useState, useContext, useEffect } from 'react';
import { ContactContext, Contact } from '../../context/contact/ContactContext';
import { AlertContext } from '../../context/alert/AlertContext';
import { Input, Textarea } from '@heroui/input';
import { Button } from '@heroui/button';
import { RadioGroup, Radio } from '@heroui/radio';
import { Card, CardBody, CardHeader } from '@heroui/card';

const ContactForm = () => {
    const contactContext = useContext(ContactContext);
    const alertContext = useContext(AlertContext);

    const { addContact, updateContact, clearCurrent, current, error } = contactContext || {};
    const { setAlert } = alertContext || {};

    const [contact, setContact] = useState({
        name: '',
        email: '',
        phone: '',
        purpose: '',
        priority: 'Medium',
        notes: '',
        type: 'personal', // Default for context type compliance
    });

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (current) {
            setContact(current as any); // Cast to handle extra fields
        } else {
            setContact({
                name: '',
                email: '',
                phone: '',
                purpose: '',
                priority: 'Medium',
                notes: '',
                type: 'personal',
            });
        }
    }, [current]);

    useEffect(() => {
        if (error && setAlert) {
            setAlert(error, 'danger');
        }
    }, [error, setAlert]);

    const { name, email, phone, purpose, priority, notes } = contact;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setContact({ ...contact, [e.target.name]: e.target.value });

    const onSelectionChange = (value: string) => {
        setContact({ ...contact, priority: value });
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (current) {
            if (updateContact) updateContact(contact as Contact);
        } else {
            if (addContact) addContact(contact as Contact);
        }
        clearAll();
    };

    const clearAll = () => {
        if (clearCurrent) clearCurrent();
    };

    return mounted ? (
        <Card className="p-4 mb-6">
            <CardHeader>
                <h2 className="text-xl font-bold text-primary">
                    {current ? 'Edit Contact' : 'Add Contact'}
                </h2>
            </CardHeader>
            <CardBody>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Name"
                        placeholder="Name"
                        name="name"
                        value={name}
                        onChange={onChange}
                        required
                        variant="bordered"
                    />
                    <Input
                        label="Email"
                        placeholder="Email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        variant="bordered"
                    />
                    <Input
                        label="Phone"
                        placeholder="Phone"
                        name="phone"
                        value={phone}
                        onChange={onChange}
                        required
                        variant="bordered"
                    />
                    <Input
                        label="Purpose"
                        placeholder="Purpose (e.g., Professional)"
                        name="purpose"
                        value={purpose}
                        onChange={onChange}
                        variant="bordered"
                    />
                    <Textarea
                        label="Notes"
                        placeholder="Add notes..."
                        name="notes"
                        value={notes}
                        onChange={onChange}
                        variant="bordered"
                    />

                    <RadioGroup
                        label="Priority"
                        value={priority}
                        onValueChange={onSelectionChange}
                        orientation="horizontal"
                    >
                        <Radio value="High">High</Radio>
                        <Radio value="Medium">Medium</Radio>
                        <Radio value="Low">Low</Radio>
                    </RadioGroup>

                    <div className="flex gap-2 mt-2">
                        <Button type="submit" color="primary" className="flex-1">
                            {current ? 'Update Contact' : 'Add Contact'}
                        </Button>
                        {current && (
                            <Button color="default" variant="flat" onPress={clearAll} className="flex-1">
                                Clear
                            </Button>
                        )}
                    </div>
                </form>
            </CardBody>
        </Card>
    ) : null;
};

export default ContactForm;
