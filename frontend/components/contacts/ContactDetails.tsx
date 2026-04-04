'use client';

import React, { useContext, useEffect, useState } from 'react';
import { ContactContext } from '../../context/contact/ContactContext';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

const ContactDetails = () => {
    const contactContext = useContext(ContactContext);
    const { current, setCurrent } = contactContext || {};

    // cast id to string because useParams returns string | string[]
    const params = useParams();
    const id = params?.id as string;

    const router = useRouter();

    const [messages, setMessages] = useState<any[]>([]);
    const [calls, setCalls] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingCalls, setLoadingCalls] = useState(true);
    const [activeTab, setActiveTab] = useState<'chats' | 'calls'>('chats');

    useEffect(() => {
        const ensureContact = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/contacts/${id}`, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                if (setCurrent) {
                    setCurrent(res.data);
                }
            } catch {
                router.push('/');
            }
        };
        ensureContact();
    }, [id, router, setCurrent]);

    // Fetch chat history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!id) return;
            setLoadingMessages(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/messages/${id}`, {
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                });
                setMessages(res.data);
            } catch (err) {
                setMessages([]);
            }
            setLoadingMessages(false);
        };
        fetchMessages();
    }, [id]);

    // Fetch call history
    useEffect(() => {
        const fetchCalls = async () => {
            if (!id) return;
            setLoadingCalls(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/interactions/calls', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' },
                });
                const selectedUserId = String((current as any)?.userId || (current as any)?.linkedUserId || '');
                const filteredCalls = (Array.isArray(res.data) ? res.data : []).filter((call: any) => {
                    const callContactId = String(call?.contactId || '');
                    return callContactId === String(id) || (selectedUserId && callContactId === selectedUserId);
                });
                setCalls(filteredCalls);
            } catch (err) {
                setCalls([]);
            }
            setLoadingCalls(false);
        };
        fetchCalls();
    }, [id, current]);

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

    const handleShare = () => {
        const params = new URLSearchParams();
        params.set('contactId', String(id));
        if (expiry > 0) params.set('minutes', String(expiry));
        const query = params.toString();
        router.push(query ? `/share-generator?${query}` : '/share-generator');
    };

    if (!current) return <div className="p-4 text-slate-200">Loading contact...</div>;

    const {
        name,
        phone,
        email,
        relationshipType,
        meetContext,
        priorityLevel,
        purpose,
        priority,
        relationshipScore,
        notes,
    } = current as any;

    const resolvedRelationship = relationshipType || purpose || 'other';
    const resolvedPriority = (priorityLevel || priority || 'medium').toLowerCase();
    const priorityColor = resolvedPriority === 'high' ? 'danger' : resolvedPriority === 'medium' ? 'warning' : 'success';
    const targetUserId = String((current as any)?.userId || (current as any)?.linkedUserId || '');
    const canCommunicate = Boolean(targetUserId);
    const toLabel = (value?: string) => {
        if (!value) return 'Other';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const openRealtimeChat = () => {
        if (!targetUserId) return;
        const params = new URLSearchParams();
        params.set('view', 'chat');
        params.set('chatWith', targetUserId);
        router.push(`/?${params.toString()}`);
    };

    const startRealtimeCall = (mode: 'audio' | 'video') => {
        if (!targetUserId) return;
        const params = new URLSearchParams();
        params.set('view', 'chat');
        params.set('chatWith', targetUserId);
        params.set('call', mode);
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="container mx-auto p-3 sm:p-4 md:p-5 space-y-5 fade-in">
            <Button className="glass-action text-slate-100" onPress={() => router.push('/')} variant="light" startContent={<i className="fas fa-arrow-left" />}>
                Back to Contacts
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <Card className="glass-panel border border-cyan-300/20 shadow-xl">
                    <CardHeader className="flex items-start justify-between gap-3 border-b border-cyan-300/15">
                        <div className="flex flex-col">
                            <p className="text-lg text-cyan-200 font-semibold">{name}</p>
                            <p className="text-small text-slate-300">{toLabel(resolvedRelationship)}</p>
                        </div>
                        <Chip color={priorityColor as any} variant="flat">{toLabel(resolvedPriority)}</Chip>
                    </CardHeader>
                    <CardBody className="pt-4">
                        <ul className="space-y-2 text-slate-100/95">
                            <li><i className="fas fa-phone mr-2 opacity-70" /> {phone}</li>
                            <li><i className="fas fa-envelope mr-2 opacity-70" /> {email}</li>
                            <li><strong>Relationship:</strong> {toLabel(resolvedRelationship)}</li>
                            <li><strong>Met at:</strong> {toLabel(meetContext || 'other')}</li>
                            <li><strong>Relationship Score:</strong> {relationshipScore}</li>
                            <li><strong>Notes:</strong> {notes || 'No notes'}</li>
                        </ul>
                    </CardBody>
                    <CardFooter className="flex flex-wrap gap-2 border-t border-cyan-300/15 pt-4">
                        <Button className="neon-action" isDisabled={!canCommunicate} onPress={openRealtimeChat}>
                            <i className="fas fa-comments mr-1" /> Chat
                        </Button>
                        <Button className="glass-action text-slate-100" isDisabled={!canCommunicate} onPress={() => startRealtimeCall('audio')}>
                            <i className="fas fa-phone mr-1" /> Call
                        </Button>
                        <Button className="glass-action text-slate-100" isDisabled={!canCommunicate} onPress={() => startRealtimeCall('video')}>
                            <i className="fas fa-video mr-1" /> Video Call
                        </Button>
                        {!canCommunicate && <span className="text-xs text-slate-300 ml-2">User not on platform</span>}
                    </CardFooter>
                </Card>
            </div>

            {/* Tabs for history */}
            <div className="mt-6">
                <div className="flex gap-2 mb-4 glass-panel p-2 w-fit">
                    <button className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'chats' ? 'bg-cyan-500/25 text-cyan-100' : 'text-slate-300 hover:bg-slate-700/40'}`} onClick={() => setActiveTab('chats')}>Chats</button>
                    <button className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'calls' ? 'bg-cyan-500/25 text-cyan-100' : 'text-slate-300 hover:bg-slate-700/40'}`} onClick={() => setActiveTab('calls')}>Calls</button>
                </div>
                {activeTab === 'chats' && (
                    <Card className="glass-panel border border-cyan-300/20">
                        <CardHeader><p className="font-semibold text-cyan-100">Chat History</p></CardHeader>
                        <CardBody>
                            {loadingMessages ? <p>Loading...</p> : (
                                <ul className="space-y-2">
                                    {messages.length === 0 && <li className="text-slate-300">No messages</li>}
                                    {messages.map((msg: any) => (
                                        <li key={msg._id} className={`p-2 rounded-lg border ${msg.senderId === current.userId ? 'bg-cyan-500/15 border-cyan-400/20 text-right' : 'bg-slate-800/70 border-slate-600/30 text-left'}`}>
                                            <span className="block text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                            <span>{msg.text || msg.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardBody>
                    </Card>
                )}
                {activeTab === 'calls' && (
                    <Card className="glass-panel border border-cyan-300/20">
                        <CardHeader><p className="font-semibold text-cyan-100">Call History</p></CardHeader>
                        <CardBody>
                            {loadingCalls ? <p>Loading...</p> : (
                                <ul className="space-y-2">
                                    {calls.length === 0 && <li className="text-slate-300">No calls</li>}
                                    {calls.map((call: any) => (
                                        <li key={call._id} className="p-2 rounded-lg bg-slate-800/70 border border-slate-600/30 flex justify-between items-center">
                                            <span>
                                                <i className={`fas ${call.type === 'incoming' || call.type === 'call_incoming' ? 'fa-arrow-down' : call.type === 'outgoing' || call.type === 'call_outgoing' ? 'fa-arrow-up' : 'fa-times'} mr-2`} />
                                                {(call.type || '').replace('call_', '')}
                                            </span>
                                            <span className="text-xs text-slate-400">{new Date(call.time || call.timestamp || call.createdAt).toLocaleString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ContactDetails;
