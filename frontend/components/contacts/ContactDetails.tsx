'use client';

import React, { useContext, useEffect, useState } from 'react';
import { ContactContext } from '../../context/contact/ContactContext';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';

const ContactDetails = () => {
    const contactContext = useContext(ContactContext);
    const { current, generateShareLink } = contactContext || {};

    // cast id to string because useParams returns string | string[]
    const params = useParams();
    const id = params?.id as string;

    const router = useRouter();

    const [interactions, setInteractions] = useState<any[]>([]);
    const [loadingInteractions, setLoadingInteractions] = useState(true);
    const [newInteraction, setNewInteraction] = useState({
        type: 'call',
        notes: '',
    });
    const [shareLink, setShareLink] = useState('');
    const [expiry, setExpiry] = useState(60);

    useEffect(() => {
        if (!current) {
            router.push('/');
        } else {
            fetchInteractions();
        }
        // eslint-disable-next-line
    }, [current, router]);

    const fetchInteractions = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/interactions/${id}`);
            setInteractions(res.data);
            setLoadingInteractions(false);
        } catch (err) {
            console.error(err);
            setLoadingInteractions(false);
        }
    };

    const handleInteractionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const config = { headers: { 'Content-Type': 'application/json' } };
            await axios.post(
                'http://localhost:5000/api/interactions',
                {
                    contactId: id,
                    ...newInteraction,
                },
                config
            );

            fetchInteractions();
            setNewInteraction({ type: 'call', notes: '' });
            // Could accept a toast here
        } catch (err) {
            console.error(err);
            alert('Error logging interaction');
        }
    };

    const handleShare = async () => {
        if (generateShareLink) {
            const result = await generateShareLink(id, expiry);
            if (result) {
                const url = `${window.location.host}/share/${result.token}`; // Use host
                setShareLink(url);
            } else {
                alert('Error generating link');
            }
        }
    };

    if (!current) return <div className="p-4">Loading contact...</div>;

    const { name, phone, email, purpose, priority, relationshipScore, notes } = current as any;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Button onPress={() => router.push('/')} variant="light" startContent={<i className="fas fa-arrow-left" />}>
                Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex gap-3">
                        <div className="flex flex-col">
                            <p className="text-md text-primary font-bold">{name}</p>
                            <p className="text-small text-default-500">{purpose}</p>
                        </div>
                        <Chip color={priority === 'High' ? 'danger' : priority === 'Medium' ? 'primary' : 'success'} variant="flat">{priority}</Chip>
                    </CardHeader>
                    <CardBody>
                        <ul className="space-y-2">
                            <li><i className="fas fa-phone mr-2 opacity-70" /> {phone}</li>
                            <li><i className="fas fa-envelope mr-2 opacity-70" /> {email}</li>
                            <li><strong>Relationship Score:</strong> {relationshipScore}</li>
                            <li><strong>Notes:</strong> {notes}</li>
                        </ul>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><p className="font-bold">Share Contact</p></CardHeader>
                    <CardBody className="gap-4">
                        <div className="flex gap-2 items-end">
                            <Input
                                type="number"
                                label="Expiry (Minutes)"
                                value={expiry.toString()}
                                onChange={(e) => setExpiry(Number(e.target.value))}
                                variant="bordered"
                            />
                            <Button onPress={handleShare} color="secondary">Generate Link</Button>
                        </div>
                        {shareLink && (
                            <div className="p-2 bg-success-50 text-success-800 rounded text-sm break-all">
                                {shareLink}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader><p className="font-bold">Log Interaction</p></CardHeader>
                <CardBody>
                    <form onSubmit={handleInteractionSubmit} className="flex flex-col md:flex-row gap-4">
                        <select
                            className="p-2 border rounded-xl bg-default-100 min-w-[150px]"
                            value={newInteraction.type}
                            onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                        >
                            <option value="call">Call</option>
                            <option value="message">Message</option>
                            <option value="meeting">Meeting</option>
                        </select>
                        <Input
                            placeholder="Notes (optional)"
                            value={newInteraction.notes}
                            onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                            className="flex-grow"
                        />
                        <Button type="submit" color="primary">Log</Button>
                    </form>
                </CardBody>
            </Card>

            <Card>
                <CardHeader><p className="font-bold">Interaction History</p></CardHeader>
                <CardBody>
                    {loadingInteractions ? <p>Loading...</p> : (
                        <ul className="space-y-2">
                            {interactions.map((inter) => (
                                <li key={inter._id} className="p-3 bg-default-50 rounded-lg">
                                    <div className="flex justify-between">
                                        <strong>{inter.type}</strong>
                                        <span className="text-sm text-gray-500">{new Date(inter.date).toLocaleString()}</span>
                                    </div>
                                    {inter.notes && <p className="text-sm mt-1">{inter.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default ContactDetails;
