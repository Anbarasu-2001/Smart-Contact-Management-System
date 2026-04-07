'use client';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { AuthContext } from '../../context/auth/AuthContext';
import { ContactContext } from '../../context/contact/ContactContext';
import { AlertContext } from '../../context/alert/AlertContext';
import socketService from '../../utils/socketService';

type ExpiryPreset = '5m' | '10m' | '1h';

type ChatSummary = {
    userId: string;
    name: string;
    lastMessage: string;
    updatedAt: string;
};

type ReceiverOption = {
    id: string;
    name: string;
    subtitle: string;
};



const ShareGeneratorPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const authContext = useContext(AuthContext);
    const contactContext = useContext(ContactContext);
    const alertContext = useContext(AlertContext);

    const { user, isAuthenticated, loadUser } = authContext || {};
    const { contacts = [], getContacts } = contactContext || {};
    const { setAlert } = alertContext || {};

    const queryReceiverId = searchParams?.get('receiverId') || '';
    const queryContactId = searchParams?.get('contactId') || '';

    const [selectedContactId, setSelectedContactId] = useState('');
    const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('10m');
    const [receiverId, setReceiverId] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
    const [contactSearch, setContactSearch] = useState('');
    const [receiverSearch, setReceiverSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        if (!isAuthenticated) {
            void loadUser?.();
        }
        void getContacts?.();
    }, [getContacts, isAuthenticated, loadUser, router]);

    useEffect(() => {
        const loadSummaries = async () => {
            try {
                const res = await api.get('/messages/summaries');
                setChatSummaries(Array.isArray(res.data) ? res.data : []);
            } catch {
                setChatSummaries([]);
            }
        };

        void loadSummaries();
    }, []);

    useEffect(() => {
        if (!queryReceiverId) return;
        setReceiverId(queryReceiverId);
    }, [queryReceiverId]);

    useEffect(() => {
        if (!queryContactId || selectedContactId) return;
        const match = contacts.find((item) => String(item?._id) === queryContactId)?._id || '';
        if (match) setSelectedContactId(match);
    }, [contacts, queryContactId, selectedContactId]);

    const receiverOptions = useMemo(() => {
        const fromChats = (chatSummaries || [])
            .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
            .map((summary) => ({
            id: summary.userId,
            name: summary.name || 'Unknown User',
            subtitle: summary.lastMessage ? `Recent: ${summary.lastMessage}` : 'Recent chat',
            }));

        const merged = new Map<string, ReceiverOption>();
        for (const item of fromChats) {
            if (!item.id || item.id === user?._id) continue;
            merged.set(item.id, item);
        }

        return Array.from(merged.values());
    }, [chatSummaries, user?._id]);

    const selectedContact = useMemo(
        () => contacts.find((item) => String(item._id) === selectedContactId) || null,
        [contacts, selectedContactId]
    );

    const selectedReceiver = useMemo(
        () => receiverOptions.find((item) => item.id === receiverId) || null,
        [receiverOptions, receiverId]
    );

    useEffect(() => {
        if (receiverId || queryReceiverId) return;
        const latest = receiverOptions[0]?.id || '';
        if (latest) setReceiverId(latest);
    }, [queryReceiverId, receiverId, receiverOptions]);

    const filteredContacts = useMemo(() => {
        const query = contactSearch.trim().toLowerCase();
        if (!query) return contacts.filter((item) => Boolean(item._id));
        return contacts.filter((item) => {
            if (!item?._id) return false;
            const name = String(item.name || '').toLowerCase();
            const phone = String(item.phone || '').toLowerCase();
            return name.includes(query) || phone.includes(query);
        });
    }, [contactSearch, contacts]);

    const recentReceivers = useMemo(() => receiverOptions.slice(0, 4), [receiverOptions]);

    const filteredReceivers = useMemo(() => {
        const query = receiverSearch.trim().toLowerCase();
        if (!query) return receiverOptions;
        return receiverOptions.filter((item) => (
            item.name.toLowerCase().includes(query)
            || item.subtitle.toLowerCase().includes(query)
        ));
    }, [receiverOptions, receiverSearch]);

    const expiresInMinutes = useMemo(() => {
        if (expiryPreset === '5m') return 5;
        if (expiryPreset === '10m') return 10;
        return 60;
    }, [expiryPreset]);

    const expiresAt = useMemo(() => {
        if (!expiresInMinutes) return '';
        return new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    }, [expiresInMinutes]);

    const generateAndSend = useCallback(async () => {
        if (!user?._id || !selectedContactId || !receiverId) {
            if (!selectedContactId) {
                setAlert?.('Select a contact', 'warning');
                return;
            }
            setAlert?.('Select receiver', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setAlert?.('Please log in again', 'danger');
            return;
        }

        try {
            setIsSending(true);
            const shareRes = await api.post(
                '/share/create',
                {
                    contactId: selectedContactId,
                    receiverId,
                    expiresInMinutes,
                    isOneTime: true,
                }
            );

            const payload = {
                messageType: 'contact_share' as const,
                sharedContactId: selectedContactId,
                shareToken: shareRes.data.token,
                sharedContactName: selectedContact?.name || 'Contact',
                shareExpiresAt: shareRes.data.expiresAt,
                sharePayload: {
                    type: 'contact_share' as const,
                    contactId: selectedContactId,
                    token: shareRes.data.token,
                    expiresAt: shareRes.data.expiresAt,
                },
            };

            socketService.connect(user._id, token);
            socketService.emit('sendMessage', {
                senderId: user._id,
                receiverId,
                message: 'Contact access granted',
                clientMessageId: `share-${Date.now()}`,
                ...payload,
            });

            setAlert?.('✅ Contact Sent', 'success');
            window.setTimeout(() => {
                router.push('/');
            }, 900);
        } catch {
            setAlert?.('Failed to generate and send share access', 'danger');
        } finally {
            setIsSending(false);
        }
    }, [expiresInMinutes, receiverId, router, selectedContact?.name, selectedContactId, setAlert, user?._id]);

    const handleGenerateClick = useCallback(() => {
        void generateAndSend();
    }, [generateAndSend]);

    return (
        <div className="flex flex-col gap-6 fade-in pb-28">
            <section className="glass-panel p-5">
                <h1 className="text-2xl font-bold neon-title">Contact Share Generator</h1>
                <p className="text-sm app-muted">Pick contact, pick receiver, and send in seconds.</p>
            </section>

            <section className="glass-panel p-5 border border-cyan-300/20 flex flex-col gap-6">
                <div>
                    <p className="text-sm app-muted">Select Contact</p>
                    <Input
                        value={contactSearch}
                        onChange={(event) => setContactSearch(event.target.value)}
                        placeholder="Search contact"
                    />
                    {selectedContact && (
                        <p className="text-sm text-emerald-300">Selected: {selectedContact.name} ✅</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                        {filteredContacts.map((item) => {
                            const selected = String(item._id) === selectedContactId;
                            return (
                                <button
                                    key={item._id}
                                    type="button"
                                    className={`glass-card border p-3 text-left ${selected ? 'ring-2 ring-cyan-300/80 border-cyan-300/70' : 'border-cyan-300/20'}`}
                                    onClick={() => setSelectedContactId(String(item._id))}
                                >
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs app-muted">{item.phone || 'No phone'}</p>
                                </button>
                            );
                        })}
                        {filteredContacts.length === 0 && <p className="text-sm app-muted">No contacts found.</p>}
                    </div>
                </div>

                <div>
                    <p className="text-sm app-muted">Select Receiver</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {recentReceivers.map((item) => {
                            const selected = item.id === receiverId;
                            return (
                                <button
                                    key={`recent-${item.id}`}
                                    type="button"
                                    className={`glass-card border p-3 text-left ${selected ? 'ring-2 ring-cyan-300/80 border-cyan-300/70' : 'border-cyan-300/20'}`}
                                    onClick={() => setReceiverId(item.id)}
                                >
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs app-muted truncate">{item.subtitle}</p>
                                </button>
                            );
                        })}
                    </div>

                    <Input
                        value={receiverSearch}
                        onChange={(event) => setReceiverSearch(event.target.value)}
                        placeholder="Search receiver"
                    />
                    {selectedReceiver && (
                        <p className="text-sm text-cyan-200">To: {selectedReceiver.name}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {filteredReceivers.map((item) => {
                            const selected = item.id === receiverId;
                            return (
                                <button
                                    key={`all-${item.id}`}
                                    type="button"
                                    className={`glass-card border p-3 text-left ${selected ? 'ring-2 ring-cyan-300/80 border-cyan-300/70' : 'border-cyan-300/20'}`}
                                    onClick={() => setReceiverId(item.id)}
                                >
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs app-muted truncate">{item.subtitle}</p>
                                </button>
                            );
                        })}
                        {filteredReceivers.length === 0 && <p className="text-sm app-muted">No receiver found.</p>}
                    </div>
                </div>

                <div>
                    <p className="text-sm app-muted">⏱ Expiry</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { key: '5m', label: '5 min' },
                            { key: '10m', label: '10 min' },
                            { key: '1h', label: '1 hour' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                className={`glass-card border p-3 text-sm text-left ${expiryPreset === item.key ? 'ring-2 ring-cyan-300/80 border-cyan-300/70' : 'border-cyan-300/20'}`}
                                onClick={() => setExpiryPreset(item.key as ExpiryPreset)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-4 border border-cyan-300/20">
                    <p className="font-semibold">Preview</p>
                    <p className="text-sm">Sharing: <span className="text-cyan-200">{selectedContact?.name || '--'}</span></p>
                    <p className="text-sm">To: <span className="text-cyan-200">{selectedReceiver?.name || '--'}</span></p>
                    <p className="text-sm">Expires: <span className="text-cyan-200">{expiresInMinutes} min</span></p>
                    {expiresAt && <p className="text-xs app-muted">Until: {new Date(expiresAt).toLocaleTimeString()}</p>}
                </div>
            </section>

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-300/20 bg-slate-950/85 backdrop-blur px-4 py-3">
                <div className="max-w-[1400px] mx-auto flex items-center gap-3">
                    <Button className="glass-action" onClick={() => router.push('/')} onPress={() => router.push('/')}>Cancel</Button>
                    <Button
                        className="premium-share-cta flex-1 py-6 text-base"
                        isDisabled={!selectedContactId || !receiverId || isSending}
                        onClick={handleGenerateClick}
                        onPress={handleGenerateClick}
                    >
                        {isSending ? 'Sending...' : 'Send Secure Contact 🚀'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ShareGeneratorPage;
