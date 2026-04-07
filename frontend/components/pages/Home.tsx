'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import Contacts from '../contacts/Contacts';
import ContactForm from '../contacts/ContactForm';
import ContactFilter from '../contacts/ContactFilter';
import { AuthContext } from '../../context/auth/AuthContext';
import { ContactContext } from '../../context/contact/ContactContext';
import { AlertContext } from '../../context/alert/AlertContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { ThemeSwitch } from '../theme-switch';
import { 
    LayoutDashboard, 
    Users, 
    MessageSquare, 
    Link as LinkIcon, 
    Shield, 
    PieChart, 
    Phone, 
    Bell, 
    Settings 
} from 'lucide-react';
import socketService from '../../utils/socketService';
import Card from '../design/Card';
import Section from '../design/Section';
import Container from '../layout/Container';
import PremiumButton from '../design/PremiumButton';
import PremiumInput from '../design/PremiumInput';
import PremiumWidget from '../design/PremiumWidget';
import PremiumCard from '../design/PremiumCard';
import AppLayout from '../layout/AppLayout';
import Sidebar from '../layout/Sidebar';
import Topbar from '../layout/Topbar';
import AppAvatar from '../design/AppAvatar';
import StatusBadge from '../design/StatusBadge';
import ListItem from '../design/ListItem';

type ViewKey =
    | 'dashboard'
    | 'contacts'
    | 'chat'
    | 'secure-links'
    | 'vault'
    | 'analytics'
    | 'calls'
    | 'reminder'
    | 'settings';

const navItems: Array<{ key: ViewKey; label: string; icon: React.ElementType }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'contacts', label: 'Contacts', icon: Users },
    { key: 'chat', label: 'Chats', icon: MessageSquare },
    { key: 'secure-links', label: 'Secure Links', icon: LinkIcon },
    { key: 'vault', label: 'Smart Vault', icon: Shield },
    { key: 'analytics', label: 'Analytics', icon: PieChart },
    { key: 'calls', label: 'Calls', icon: Phone },
    { key: 'reminder', label: 'Reminders', icon: Bell },
    { key: 'settings', label: 'Settings', icon: Settings },
];

type ChatMessage = {
    _id?: string;
    contactId: string;
    senderId?: string;
    receiverId?: string;
    chatRoomId?: string;
    messageType?: 'text' | 'contact_share';
    text: string;
    sender: 'user' | 'contact';
    createdAt: string;
    clientMessageId?: string;
    sharedContactId?: string | null;
    shareToken?: string | null;
    shareLink?: string | null;
    sharedContactName?: string | null;
    shareExpiresAt?: string | null;
    sharePayload?: {
        type: 'contact_share';
        contactId: string;
        token: string;
        expiresAt: string;
    } | null;
    status?: 'sent' | 'delivered' | 'seen';
    deliveredAt?: string | null;
    seenAt?: string | null;
    isTemporary?: boolean;
    expiresAt?: string | null;
};

type IncomingCallPayload = {
    from: string;
    fromName?: string;
    offer?: RTCSessionDescriptionInit;
    type?: 'audio' | 'video';
};

type DashboardInsights = {
    totalContacts: number;
    activeContacts: number;
    inactiveContacts: number;
    pendingFollowUps: number;
    mostContacted: { name: string; frequency: number } | null;
    leastContacted: { name: string; frequency: number } | null;
    topContacts: Array<{ _id: string; name: string; frequency: number; priorityLabel: string }>;
    needsAttention: Array<{ _id: string; name: string; missedCallCount: number; priorityLabel: string }>;
    aiSuggestions: Array<{ contactId: string; message: string; priority: 'low' | 'medium' | 'high' }>;
};

type AIReminder = {
    _id: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    isRead?: boolean;
    contactId?: string | null;
    createdAt: string;
};

type RealtimeNotification = {
    id: string;
    type: 'message' | 'call' | 'reminder';
    title: string;
    body: string;
    senderId?: string;
    contactId?: string;
    createdAt: string;
};

type SharePreset = '5m' | '10m' | '1h';

type Reminder = {
    _id: string;
    message: string;
    contactId?: string;
    remindAt: string;
    repeat: 'none' | 'daily' | 'weekly' | 'monthly';
};

type ChatSummary = {
    userId: string;
    name: string;
    lastMessage: string;
    updatedAt: string;
    unreadCount?: number;
};

type ChatThreadMeta = {
    pinned?: boolean;
    archived?: boolean;
};

type CallHistoryItem = {
    id: string;
    contactId: string;
    name: string;
    type: 'incoming' | 'outgoing' | 'missed';
    time: string;
    duration: number;
};

type QuickContact = {
    _id?: string;
    name: string;
    userId?: string | null;
    linkedUserId?: string | null;
};

type ShareGenerationResult = {
    token: string;
    expiresAt: string;
    contactId: string;
    contactName: string;
};

type ShareUpdatedPayload = {
    token: string;
    status?: 'active' | 'viewed' | 'expired';
    isActive?: boolean;
    expiresAt?: string;
};

const Home = () => {
    const authContext = useContext(AuthContext);
    const contactContext = useContext(ContactContext);
    const alertContext = useContext(AlertContext);
    const router = useRouter();
    const searchParams = useSearchParams();

    const { loadUser, loading, isAuthenticated, user } = authContext || {};
    const { contacts = [], current, clearCurrent } = contactContext || {};
    const { setAlert } = alertContext || {};
    const [activeView, setActiveView] = useState<ViewKey>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
    const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);
    const [toasts, setToasts] = useState<RealtimeNotification[]>([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [activeChatId, setActiveChatId] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [reminderMessage, setReminderMessage] = useState('');
    const [reminderContact, setReminderContact] = useState('');
    const [reminderDateTime, setReminderDateTime] = useState('');
    const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [messagesByContact, setMessagesByContact] = useState<Record<string, ChatMessage[]>>({});
    const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
    const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
    const [chatMetaById, setChatMetaById] = useState<Record<string, ChatThreadMeta>>({});
    const [temporaryMode, setTemporaryMode] = useState(false);
    const [temporaryMinutes, setTemporaryMinutes] = useState(60);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'incoming' | 'connected' | 'ended' | 'failed'>('idle');
    const [callTimer, setCallTimer] = useState(0);
    const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
    const [callPeerId, setCallPeerId] = useState<string>('');
    const [callPeerName, setCallPeerName] = useState('');
    const [callDirection, setCallDirection] = useState<'incoming' | 'outgoing'>('outgoing');
    const [callMode, setCallMode] = useState<'audio' | 'video'>('audio');
    const [callError, setCallError] = useState('');
    const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
    const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [shareContactId, setShareContactId] = useState('');
    const [sharePreset, setSharePreset] = useState<SharePreset>('10m');
    const [shareResult, setShareResult] = useState<ShareGenerationResult | null>(null);
    const [shareIsOneTime, setShareIsOneTime] = useState(false);
    const [isCreatingShare, setIsCreatingShare] = useState(false);
    const [shareActionByToken, setShareActionByToken] = useState<Record<string, 'idle' | 'loading' | 'expired' | 'used' | 'invalid'>>({});
    const [typingByContact, setTypingByContact] = useState<Record<string, boolean>>({});
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [dashboardInsights, setDashboardInsights] = useState<DashboardInsights | null>(null);
    const [aiReminders, setAiReminders] = useState<AIReminder[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const typingStopTimer = useRef<number | null>(null);
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const hasRemoteDescriptionRef = useRef(false);
    const callRingTimeoutRef = useRef<number | null>(null);
    const lastIncomingCallRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
    const callAcceptedRef = useRef(false);
    const deepLinkHandledRef = useRef('');
    const callSnapshotRef = useRef<{
        callPeerId: string;
        callPeerName: string;
        callStatus: 'idle' | 'calling' | 'ringing' | 'incoming' | 'connected' | 'ended' | 'failed';
        callDirection: 'incoming' | 'outgoing';
        callTimer: number;
    }>({
        callPeerId: '',
        callPeerName: '',
        callStatus: 'idle',
        callDirection: 'outgoing',
        callTimer: 0,
    });

    const notifCount = notificationBadgeCount;
    const currentContactId = activeChatId;

    const formatCallTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const clearRingTimeout = useCallback(() => {
        if (callRingTimeoutRef.current) {
            window.clearTimeout(callRingTimeoutRef.current);
            callRingTimeoutRef.current = null;
        }
    }, []);



    const toShareMinutes = () => {
        if (sharePreset === '5m') return 5;
        if (sharePreset === '10m') return 10;
        if (sharePreset === '1h') return 60;
        return 10;
    };

    const getShareToken = (message: ChatMessage) => message.sharePayload?.token || message.shareToken || '';

    const getShareExpiresAt = (message: ChatMessage) => {
        const value = message.sharePayload?.expiresAt || message.shareExpiresAt || null;
        return value ? new Date(value) : null;
    };

    const formatShareExpiry = (value?: string | null) => {
        if (!value) return '--';
        const diffMs = new Date(value).getTime() - Date.now();
        if (diffMs <= 0) return 'Expired';
        const mins = Math.ceil(diffMs / (60 * 1000));
        if (mins < 60) return `${mins} min`;
        const hours = Math.ceil(mins / 60);
        return `${hours} hr`;
    };

    const openShareGenerator = useCallback((preferredContactId?: string) => {
        const params = new URLSearchParams();
        if (activeChatId) params.set('receiverId', activeChatId);
        if (preferredContactId) params.set('contactId', preferredContactId);
        const query = params.toString();
        router.push(query ? `/share-generator?${query}` : '/share-generator');
    }, [activeChatId, router]);

    const upsertSummary = useCallback((userId: string, data: Partial<ChatSummary>) => {
        if (!userId) return;
        setChatSummaries((prev) => {
            const existing = prev.find((item) => item.userId === userId);
            if (existing) {
                const updated: ChatSummary = {
                    ...existing,
                    ...data,
                    userId,
                    name: data.name || existing.name,
                    lastMessage: data.lastMessage ?? existing.lastMessage,
                    updatedAt: data.updatedAt || existing.updatedAt,
                };
                return [updated, ...prev.filter((item) => item.userId !== userId)];
            }

            return [
                {
                    userId,
                    name: data.name || 'Unknown User',
                    lastMessage: data.lastMessage || '',
                    updatedAt: data.updatedAt || new Date().toISOString(),
                    unreadCount: data.unreadCount ?? 0,
                },
                ...prev,
            ];
        });
    }, []);

    const pushShareToChat = useCallback((targetId: string, data: ShareGenerationResult) => {
        const targetName = chatSummaries.find((summary) => summary.userId === targetId)?.name || 'Unknown User';
        const payload: ChatMessage = {
            contactId: targetId,
            messageType: 'contact_share',
            text: 'Contact access granted',
            sender: 'user',
            createdAt: new Date().toISOString(),
            clientMessageId: `share-${Date.now()}`,
            sharedContactId: data.contactId,
            shareToken: data.token,
            sharedContactName: data.contactName,
            shareExpiresAt: data.expiresAt,
            sharePayload: {
                type: 'contact_share',
                contactId: data.contactId,
                token: data.token,
                expiresAt: data.expiresAt,
            },
        };

        setMessagesByContact((prev) => ({
            ...prev,
            [targetId]: [...(prev[targetId] || []), payload],
        }));
        upsertSummary(targetId, {
            name: targetName,
            lastMessage: 'Contact access granted',
            updatedAt: payload.createdAt,
            unreadCount: 0,
        });

        socketService.emit('sendMessage', {
            senderId: user?._id,
            receiverId: targetId,
            message: payload.text,
            clientMessageId: payload.clientMessageId,
            messageType: 'contact_share',
            sharedContactId: payload.sharedContactId,
            shareToken: payload.shareToken,
            sharedContactName: payload.sharedContactName,
            shareExpiresAt: payload.shareExpiresAt,
            sharePayload: payload.sharePayload,
        });
    }, [chatSummaries, upsertSummary, user?._id]);

    const consumeSharedContactAction = async (message: ChatMessage, action: 'call' | 'chat') => {
        const token = getShareToken(message);
        if (!token || !currentContactId) return;

        const expiresAt = getShareExpiresAt(message);
        if (expiresAt && expiresAt.getTime() <= Date.now()) {
            setShareActionByToken((prev) => ({ ...prev, [token]: 'expired' }));
            setAlert?.('Access expired', 'warning');
            return;
        }

        setShareActionByToken((prev) => ({ ...prev, [token]: 'loading' }));
        try {
            const res = await api.post(
                `/share/${token}/access`,
                { action }
            );
            const status = String(res?.data?.status || 'active');
            if (status === 'expired') {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'expired' }));
                setAlert?.('Access expired', 'warning');
                return;
            }

            if (!res?.data?.isActive && res?.data?.isOneTime) {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'used' }));
            } else {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'idle' }));
            }

            if (action === 'call') {
                const callTargetName = contacts.find((item) => String(item?._id) === String(currentContactId))?.name || 'Unknown';
                void startOutgoingCall(currentContactId, 'audio', callTargetName);
                return;
            }
            setActiveView('chat');
            setActiveChatId(currentContactId);
            setAlert?.('Secure chat access granted', 'success');
        } catch (err: any) {
            const statusCode = err?.response?.status;
            if (statusCode === 410) {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'expired' }));
                setAlert?.('Access expired', 'warning');
            } else if (statusCode === 403 || statusCode === 404) {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'invalid' }));
                setAlert?.('Access denied for this token', 'danger');
            } else {
                setShareActionByToken((prev) => ({ ...prev, [token]: 'invalid' }));
                setAlert?.('Unable to validate secure access', 'danger');
            }
        }
    };

    const buildChatRoomId = useCallback((a: string, b: string) => `chat:${[String(a), String(b)].sort().join('_')}`, []);

    const cleanupCallMedia = useCallback((nextStatus: 'idle' | 'ended' | 'failed' = 'idle') => {
        clearRingTimeout();
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        callAcceptedRef.current = false;
        hasRemoteDescriptionRef.current = false;
        pendingIceCandidatesRef.current = [];

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        setCallStatus(nextStatus);
        setCallTimer(0);
        setCallPeerId('');
        setCallPeerName('');
        setIncomingCall(null);
        setIsMuted(false);
        setIsCameraOff(false);
        setIsSpeakerOn(true);
    }, [clearRingTimeout]);

    const addCallHistoryEntry = useCallback((entry: CallHistoryItem) => {
        setCallHistory((prev) => {
            if (prev.some((item) => item.id === entry.id)) return prev;

            const nearDuplicate = prev.some((item) => (
                item.contactId === entry.contactId
                && item.type === entry.type
                && item.duration === entry.duration
                && Math.abs(new Date(item.time).getTime() - new Date(entry.time).getTime()) < 8000
            ));
            if (nearDuplicate) return prev;

            return [entry, ...prev].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        });
    }, []);

    const loadCallHistory = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/interactions/calls');
            setCallHistory(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCallHistory([]);
        }
    }, [isAuthenticated]);

    const createPeerConnection = useCallback((peerId: string) => {
        if (peerConnectionRef.current) {
            try {
                peerConnectionRef.current.close();
            } catch {
                // Ignore close errors from stale peer objects.
            }
        }

        pendingIceCandidatesRef.current = [];
        hasRemoteDescriptionRef.current = false;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && peerId) {
                socketService.emit('iceCandidate', { to: peerId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (remoteVideoRef.current && stream) {
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.muted = !isSpeakerOn;
                remoteVideoRef.current.volume = isSpeakerOn ? 1 : 0;
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'connected') {
                clearRingTimeout();
                setCallError('');
                setCallStatus('connected');
                callAcceptedRef.current = true;
                return;
            }

            if (state === 'failed') {
                clearRingTimeout();
                setCallError('Call failed');
                cleanupCallMedia('failed');
                return;
            }

            if (state === 'disconnected') {
                clearRingTimeout();
                setCallError('Connection lost');
                cleanupCallMedia('failed');
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [cleanupCallMedia, clearRingTimeout, isSpeakerOn]);

    const applyRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(description));
        hasRemoteDescriptionRef.current = true;

        const queued = [...pendingIceCandidatesRef.current];
        pendingIceCandidatesRef.current = [];
        for (const candidate of queued) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
                // Ignore malformed/transient ICE candidates.
            }
        }
    }, []);

    const startOutgoingCall = useCallback(async (peerId: string, mode: 'audio' | 'video', peerName?: string) => {
        if (!peerId || !user?._id) return;

        try {
            clearRingTimeout();
            setCallError('');
            setIncomingCall(null);
            setCallTimer(0);
            setCallStatus('calling');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mode === 'video',
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const pc = createPeerConnection(peerId);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketService.emit('callUser', {
                to: peerId,
                from: user._id,
                fromName: user.name,
                offer,
                type: mode,
            });

            setCallMode(mode);
            setCallPeerId(peerId);
            setCallPeerName(peerName || contacts.find((item) => item._id === peerId)?.name || 'Unknown');
            setCallDirection('outgoing');
            setCallStatus('ringing');

            callRingTimeoutRef.current = window.setTimeout(() => {
                if (callSnapshotRef.current.callStatus === 'ringing') {
                    setCallError('User not available');
                    cleanupCallMedia('failed');
                }
            }, 20000);
        } catch {
            setCallError('Call failed');
            setAlert?.('Unable to access microphone/camera', 'danger');
            cleanupCallMedia('failed');
        }
    }, [cleanupCallMedia, clearRingTimeout, createPeerConnection, setAlert, user?._id, user?.name, contacts]);

    const acceptIncomingCall = useCallback(async () => {
        if (!incomingCall?.from || !incomingCall.offer) return;

        const mode = incomingCall.type === 'video' ? 'video' : 'audio';
        try {
            clearRingTimeout();
            setCallError('');
            setCallStatus('incoming');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mode === 'video',
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const pc = createPeerConnection(incomingCall.from);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            await applyRemoteDescription(incomingCall.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketService.emit('accept-call', { to: incomingCall.from, answer });
            socketService.emit('answerCall', { to: incomingCall.from, answer });

            setCallMode(mode);
            setCallPeerId(incomingCall.from);
            setCallPeerName(incomingCall.fromName || contacts.find((item) => item._id === incomingCall.from)?.name || 'Unknown');
            setCallDirection('incoming');
            setCallStatus('connected');
            setCallTimer(0);
            setIncomingCall(null);
        } catch {
            setCallError('Call failed');
            setAlert?.('Failed to accept call', 'danger');
            cleanupCallMedia('failed');
        }
    }, [applyRemoteDescription, cleanupCallMedia, clearRingTimeout, createPeerConnection, incomingCall, setAlert, contacts]);

    const rejectIncomingCall = useCallback(() => {
        if (incomingCall?.from) {
            clearRingTimeout();
            socketService.emit('reject-call', { to: incomingCall.from });
            addCallHistoryEntry({
                id: `local-missed-${Date.now()}`,
                contactId: incomingCall.from,
                name: incomingCall.fromName || contacts.find((item) => item._id === incomingCall.from)?.name || 'Unknown',
                type: 'missed',
                time: new Date().toISOString(),
                duration: 0,
            });
            window.setTimeout(() => {
                void loadCallHistory();
            }, 700);
        }
        setIncomingCall(null);
        setCallStatus('ended');
        setCallPeerId('');
        setCallPeerName('');
    }, [incomingCall, clearRingTimeout, addCallHistoryEntry, contacts, loadCallHistory]);

    const endCurrentCall = useCallback(() => {
        clearRingTimeout();
        if (callPeerId) {
            socketService.emit('endCall', { to: callPeerId });
            addCallHistoryEntry({
                id: `local-end-${Date.now()}`,
                contactId: callPeerId,
                name: callPeerName || contacts.find((item) => item._id === callPeerId)?.name || 'Unknown',
                type: callStatus === 'connected' ? callDirection : 'missed',
                time: new Date().toISOString(),
                duration: callStatus === 'connected' ? callTimer : 0,
            });
            window.setTimeout(() => {
                void loadCallHistory();
            }, 700);
        }
        cleanupCallMedia('ended');
    }, [callPeerId, cleanupCallMedia, clearRingTimeout, addCallHistoryEntry, callDirection, callPeerName, callStatus, callTimer, contacts, loadCallHistory]);

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const next = !isMuted;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = !next;
        });
        setIsMuted(next);
    }, [isMuted]);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const next = !isCameraOff;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = !next;
        });
        setIsCameraOff(next);
    }, [isCameraOff]);

    const toggleSpeaker = useCallback(() => {
        const next = !isSpeakerOn;
        setIsSpeakerOn(next);

        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !next;
            remoteVideoRef.current.volume = next ? 1 : 0;
        }
    }, [isSpeakerOn]);

    const pushNotification = useCallback((payload: RealtimeNotification) => {
        setNotifications((prev) => [payload, ...prev].slice(0, 50));
        setNotificationBadgeCount((prev) => prev + 1);
        setToasts((prev) => [payload, ...prev].slice(0, 4));
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((n) => n.id !== payload.id));
        }, 4000);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(payload.title, { body: payload.body || 'New notification' });
            } catch {
                // Browser notification can fail in restricted contexts.
            }
        }

        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.25;
            void audio.play();
        } catch {
            // Optional sound; ignore playback errors.
        }
    }, []);

    const showToast = useCallback((message: string, notification?: Partial<RealtimeNotification>) => {
        const item: RealtimeNotification = {
            id: notification?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: (notification?.type as RealtimeNotification['type']) || 'message',
            title: notification?.title || 'New Message',
            body: message,
            senderId: notification?.senderId,
            contactId: notification?.contactId,
            createdAt: notification?.createdAt || new Date().toISOString(),
        };
        pushNotification(item);
    }, [pushNotification]);

    const handleRealtimeNotification = useCallback((payload: Partial<RealtimeNotification>) => {
        if (!payload?.title && !payload?.body) return;
        const item: RealtimeNotification = {
            id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: (payload.type as RealtimeNotification['type']) || 'message',
            title: payload.title || 'New Message',
            body: payload.body || '',
            senderId: payload.senderId,
            contactId: payload.contactId,
            createdAt: payload.createdAt || new Date().toISOString(),
        };
        showToast(item.body, item);
    }, [showToast]);

    const handleNotificationClick = useCallback((notification: RealtimeNotification) => {
        if (notification.type === 'message') {
            setActiveView('chat');
            if (notification.contactId) {
                setActiveChatId(notification.contactId);
            }
        } else if (notification.type === 'call') {
            setActiveView('calls');
        } else {
            setActiveView('reminder');
        }

        setShowNotificationPanel(false);
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, []);

    const openChat = useCallback((contact: { id: string; name?: string }) => {
        if (!contact?.id) return;
        setActiveChatId(contact.id);
        setChatInput('');
    }, []);

    const openInlineShareSheet = useCallback(() => {
        if (!currentContactId) {
            setAlert?.('Open a chat first', 'warning');
            return;
        }

        const fallback = contacts.find((contact) => Boolean(contact._id))?._id || '';
        const storageKey = user?._id ? `last-share-contact:${user._id}` : 'last-share-contact';
        const lastUsed = localStorage.getItem(storageKey) || '';
        const validLastUsed = contacts.some((contact) => String(contact?._id) === String(lastUsed));

        setShareContactId(validLastUsed ? String(lastUsed) : String(fallback));
        setSharePreset('10m');
        setShareResult(null);
        setShowSharePopup(true);
    }, [contacts, currentContactId, setAlert, user?._id]);

    const openChatFromContact = useCallback((contact: QuickContact) => {
        const targetUserId = String(contact?.userId || contact?.linkedUserId || '');
        if (!targetUserId) {
            setAlert?.('❌ This contact is not using the app', 'warning');
            return;
        }
        setActiveView('chat');
        openChat({ id: targetUserId, name: contact.name });
    }, [openChat, setAlert]);

    const startCallFromContact = useCallback((contact: QuickContact, mode: 'audio' | 'video') => {
        const targetUserId = String(contact?.userId || contact?.linkedUserId || '');
        if (!targetUserId) {
            setAlert?.('❌ This contact is not using the app', 'warning');
            return;
        }
        void startOutgoingCall(targetUserId, mode, contact.name);
    }, [setAlert, startOutgoingCall]);

    useEffect(() => {
        const viewParam = String(searchParams.get('view') || '').trim();
        const chatWith = String(searchParams.get('chatWith') || '').trim();
        const callMode = String(searchParams.get('call') || '').trim();
        const actionKey = `${viewParam}|${chatWith}|${callMode}`;

        if (!actionKey || actionKey === '||') return;
        if (deepLinkHandledRef.current === actionKey) return;

        if (viewParam === 'chat') {
            setActiveView('chat');
        }
        if (chatWith) {
            setActiveChatId(chatWith);
        }

        if (chatWith && (callMode === 'audio' || callMode === 'video')) {
            const fromContacts = contacts.find((item) => String(item?._id) === chatWith || String(item?.userId) === chatWith || String(item?.linkedUserId) === chatWith);
            void startOutgoingCall(chatWith, callMode, fromContacts?.name || 'Unknown');
        }

        deepLinkHandledRef.current = actionKey;
        router.replace('/');
    }, [searchParams, contacts, startOutgoingCall, router]);

    useEffect(() => {
        if (loadUser) {
            loadUser();
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission === 'default') {
            void Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    const normalizedContacts = useMemo(
        () =>
            contacts
                .filter((contact) => {
                    const query = search.trim().toLowerCase();
                    if (!query) return true;
                    return (
                        contact.name?.toLowerCase().includes(query) ||
                        contact.email?.toLowerCase().includes(query) ||
                        contact.phone?.toLowerCase().includes(query)
                    );
                })
                .slice(0, 6),
        [contacts, search],
    );

    const contactNameById = useMemo(
        () => {
            const map = new Map<string, string>();
            contacts.forEach((item) => {
                const name = item?.name || 'Unknown User';
                if (item?._id) map.set(String(item._id), name);
                if (item?.userId) map.set(String(item.userId), name);
                if (item?.linkedUserId) map.set(String(item.linkedUserId), name);
            });
            return map;
        },
        [contacts],
    );

    const getChatDisplayName = useCallback((userId: string, summaryName?: string) => {
        const raw = (summaryName || '').trim();
        const isPlaceholder = !raw || /^unknown(\s+user)?$/i.test(raw);
        if (!isPlaceholder) return raw;

        const fromContacts = contactNameById.get(String(userId));
        return (fromContacts || raw || 'Unknown User').trim();
    }, [contactNameById]);

    const sortedChatThreads = useMemo(() => {
        const query = search.trim().toLowerCase();
        return [...chatSummaries]
            .map((chat) => ({
                id: chat.userId,
                name: getChatDisplayName(chat.userId, chat.name),
                time: chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                unread: unreadByContact[chat.userId] ?? chat.unreadCount ?? 0,
                lastMessage: chat.lastMessage || 'No messages yet',
                updatedAtMs: chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0,
                isPinned: Boolean(chatMetaById[chat.userId]?.pinned),
                isArchived: Boolean(chatMetaById[chat.userId]?.archived),
            }))
            .filter((thread) => {
                if (thread.isArchived) return false;
                if (!query) return true;
                return thread.name.toLowerCase().includes(query) || thread.lastMessage.toLowerCase().includes(query);
            })
            .sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }
                return b.updatedAtMs - a.updatedAtMs;
            });
    }, [chatSummaries, unreadByContact, search, chatMetaById, getChatDisplayName]);

    const currentContact = sortedChatThreads.find((thread) => thread.id === currentContactId)
        || (currentContactId ? { id: currentContactId, name: getChatDisplayName(currentContactId, ''), time: '--:--', unread: 0, lastMessage: '', updatedAtMs: 0 } : null);

    useEffect(() => {
        if (!user?._id) return;
        const storageKey = `chat-meta:${user._id}`;
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                setChatMetaById({});
                return;
            }
            const parsed = JSON.parse(raw);
            setChatMetaById(parsed && typeof parsed === 'object' ? parsed : {});
        } catch {
            setChatMetaById({});
        }
    }, [user?._id]);

    useEffect(() => {
        if (!user?._id) return;
        const storageKey = `chat-meta:${user._id}`;
        localStorage.setItem(storageKey, JSON.stringify(chatMetaById));
    }, [chatMetaById, user?._id]);

    const toggleChatPin = useCallback((contactId: string) => {
        setChatMetaById((prev) => ({
            ...prev,
            [contactId]: {
                ...prev[contactId],
                pinned: !prev[contactId]?.pinned,
            },
        }));
    }, []);

    const toggleChatArchive = useCallback((contactId: string) => {
        setChatMetaById((prev) => ({
            ...prev,
            [contactId]: {
                ...prev[contactId],
                archived: !prev[contactId]?.archived,
            },
        }));
    }, []);

    useEffect(() => {
        callSnapshotRef.current = {
            callPeerId,
            callPeerName,
            callStatus,
            callDirection,
            callTimer,
        };
    }, [callPeerId, callPeerName, callStatus, callDirection, callTimer]);

    const dashboardStats = useMemo(
        () => ({
            totalContacts: contacts.length,
            activeChats: chatSummaries.length,
            callsToday: Math.max(1, Math.min(contacts.length, 7)),
            upcomingReminders: reminders.length + aiReminders.filter((r) => !r.isRead).length,
        }),
        [contacts.length, chatSummaries.length, reminders.length, aiReminders],
    );

    useEffect(() => {
        if (!activeChatId) return;
        const existsInThreads = sortedChatThreads.some((thread) => thread.id === activeChatId);
        const existsInContacts = contacts.some((contact) => String(contact._id) === activeChatId);
        const exists = existsInThreads || existsInContacts;
        if (!exists) {
            setActiveChatId('');
        }
    }, [sortedChatThreads, activeChatId, contacts]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const loadChatSummaries = async () => {
            try {
                const res = await api.get('/messages/summaries');
                const normalized = (Array.isArray(res.data) ? res.data : []).map((summary: ChatSummary) => ({
                    ...summary,
                    name: getChatDisplayName(summary.userId, summary.name),
                }));
                setChatSummaries(normalized);

                const unreadMap = normalized.reduce(
                    (acc: Record<string, number>, summary: ChatSummary) => {
                        if (summary?.userId) {
                            acc[summary.userId] = summary.unreadCount || 0;
                        }
                        return acc;
                    },
                    {},
                );
                setUnreadByContact(unreadMap);
            } catch {
                setChatSummaries([]);
            }
        };

        loadChatSummaries();
    }, [isAuthenticated, getChatDisplayName]);

    useEffect(() => {
        if (!user?._id || !isAuthenticated) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        socketService.connect(user._id, token);
        socketService.emit('join', user._id);
        socketService.emit('online', user._id);

        const onSocketConnected = () => {
        };

        const onSocketDisconnected = () => {
        };

        const onNewMessage = (message: ChatMessage) => {
            const bucketId = message.contactId
                || (message.senderId && message.senderId !== user._id ? message.senderId : message.receiverId)
                || '';
            if (!bucketId) return;
            setMessagesByContact((prev) => {
                const existing = prev[bucketId] || [];
                if (existing.some((m) => (m._id && m._id === message._id) || (m.clientMessageId && m.clientMessageId === message.clientMessageId))) {
                    return prev;
                }
                return { ...prev, [bucketId]: [...existing, { ...message, contactId: bucketId }] };
            });

            const isIncoming = (message.senderId && message.senderId !== user._id) || message.sender === 'contact';
            const fallbackName = getChatDisplayName(String(bucketId), '');
            upsertSummary(bucketId, {
                name: fallbackName,
                lastMessage: message.text || '',
                updatedAt: message.createdAt || new Date().toISOString(),
            });

            if (isIncoming) {
                setUnreadByContact((prev) => ({ ...prev, [bucketId]: (prev[bucketId] || 0) + 1 }));
                setAlert?.('New message received', 'primary');
            }
        };

        const onIncomingCall = (payload: IncomingCallPayload) => {
            const dedupeKey = `${String(payload?.from || '')}:${String(payload?.type || 'audio')}`;
            const now = Date.now();
            if (lastIncomingCallRef.current.key === dedupeKey && now - lastIncomingCallRef.current.at < 1200) {
                return;
            }
            lastIncomingCallRef.current = { key: dedupeKey, at: now };

            clearRingTimeout();
            setCallError('');
            setIncomingCall(payload);
            setCallMode(payload.type === 'video' ? 'video' : 'audio');
            setCallPeerId(payload.from || '');
            setCallPeerName(payload.fromName || contactNameById.get(String(payload.from)) || 'Unknown');
            setCallStatus('incoming');
            setAlert?.(`Incoming call from ${payload.fromName}`, 'warning');
        };

        const onReminderDue = (payload: { message: string }) => {
            setAlert?.(`Reminder: ${payload.message}`, 'secondary');
        };

        const onAIReminderDue = (payload: AIReminder) => {
            setAiReminders((prev) => [payload, ...prev]);
            setAlert?.(`AI Reminder: ${payload.message}`, payload.priority === 'high' ? 'warning' : 'primary');
        };

        const onTypingStart = (payload: { contactId: string }) => {
            if (!payload?.contactId) return;
            setTypingByContact((prev) => ({ ...prev, [payload.contactId]: true }));
        };

        const onTypingAlias = (payload: { from: string }) => {
            if (!payload?.from) return;
            setTypingByContact((prev) => ({ ...prev, [payload.from]: true }));
        };

        const onTypingStop = (payload: { contactId: string }) => {
            if (!payload?.contactId) return;
            setTypingByContact((prev) => ({ ...prev, [payload.contactId]: false }));
        };

        const onStopTypingAlias = (payload: { from: string }) => {
            if (!payload?.from) return;
            setTypingByContact((prev) => ({ ...prev, [payload.from]: false }));
        };

        const onOnlineUsers = (users: string[]) => {
            setOnlineUsers(Array.isArray(users) ? users : []);
        };

        const onMessageDelivered = (payload: { messageId?: string; contactId?: string; receiverId?: string }) => {
            const contactId = payload?.contactId || payload?.receiverId || '';
            if (!contactId) return;
            setMessagesByContact((prev) => {
                const list = prev[contactId] || [];
                const next: ChatMessage[] = list.map((m) => {
                    if (payload.messageId && m._id === payload.messageId) {
                        return { ...m, status: 'delivered' as const, deliveredAt: new Date().toISOString() };
                    }
                    if (!payload.messageId && m.sender === 'user') {
                        return { ...m, status: (m.status === 'seen' ? 'seen' : 'delivered') as 'seen' | 'delivered' };
                    }
                    return m;
                });
                return { ...prev, [contactId]: next };
            });
        };

        const onMessageSeen = (payload: { contactId?: string }) => {
            if (!payload?.contactId) return;
            setMessagesByContact((prev) => {
                const list = prev[payload.contactId || ''] || [];
                const next: ChatMessage[] = list.map((m) => (m.sender === 'user'
                    ? { ...m, status: 'seen' as const, seenAt: new Date().toISOString() }
                    : m));
                return { ...prev, [payload.contactId || '']: next };
            });
        };

        const onCallAnswered = async (payload: { answer: RTCSessionDescriptionInit }) => {
            try {
                if (!peerConnectionRef.current || !payload?.answer) return;
                if (callAcceptedRef.current) return;
                await applyRemoteDescription(payload.answer);
                callAcceptedRef.current = true;
                clearRingTimeout();
                setIncomingCall(null);
                setCallError('');
                setCallStatus('connected');
                setCallTimer(0);
            } catch {
                setCallError('Call failed');
                setAlert?.('Failed to establish call', 'danger');
            }
        };

        const onIceCandidate = async (payload: { candidate: RTCIceCandidateInit }) => {
            try {
                if (!peerConnectionRef.current || !payload?.candidate) return;
                if (!hasRemoteDescriptionRef.current) {
                    pendingIceCandidatesRef.current.push(payload.candidate);
                    return;
                }
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {
                // Ignore transient candidate errors.
            }
        };

        const onCallRejected = () => {
            clearRingTimeout();
            setCallError('User not available');
            cleanupCallMedia('failed');
        };

        const onUserOffline = () => {
            clearRingTimeout();
            setCallError('User not available');
            cleanupCallMedia('failed');
        };

        const onCallEnded = () => {
            clearRingTimeout();
            const snapshot = callSnapshotRef.current;
            if (snapshot.callPeerId) {
                addCallHistoryEntry({
                    id: `local-ended-${Date.now()}`,
                    contactId: snapshot.callPeerId,
                    name: snapshot.callPeerName || contactNameById.get(String(snapshot.callPeerId)) || 'Unknown',
                    type: snapshot.callStatus === 'connected' ? snapshot.callDirection : 'missed',
                    time: new Date().toISOString(),
                    duration: snapshot.callStatus === 'connected' ? snapshot.callTimer : 0,
                });
                window.setTimeout(() => {
                    void loadCallHistory();
                }, 700);
            }
            cleanupCallMedia('ended');
        };

        const onShareUpdated = (payload: ShareUpdatedPayload) => {
            if (!payload?.token) return;

            setShareActionByToken((prev) => {
                const current = prev[payload.token] || 'idle';
                if (payload.status === 'expired' || payload.isActive === false) {
                    return { ...prev, [payload.token]: 'expired' };
                }
                if (current === 'used' || current === 'invalid') {
                    return prev;
                }
                return { ...prev, [payload.token]: 'idle' };
            });

            if (!payload.expiresAt && payload.isActive !== false && payload.status !== 'expired') {
                return;
            }

            setMessagesByContact((prev) => {
                const updated: Record<string, ChatMessage[]> = {};
                let changed = false;

                Object.entries(prev).forEach(([contactId, messages]) => {
                    const nextMessages = messages.map((message) => {
                        const token = getShareToken(message);
                        if (!token || token !== payload.token) return message;
                        changed = true;
                        const nextExpiry = payload.status === 'expired' || payload.isActive === false
                            ? new Date(Date.now() - 1000).toISOString()
                            : (payload.expiresAt || message.shareExpiresAt || message.sharePayload?.expiresAt || null);

                        return {
                            ...message,
                            shareExpiresAt: nextExpiry,
                            sharePayload: message.sharePayload
                                ? { ...message.sharePayload, expiresAt: nextExpiry || message.sharePayload.expiresAt }
                                : message.sharePayload,
                        };
                    });
                    updated[contactId] = nextMessages;
                });

                return changed ? updated : prev;
            });
        };

        socketService.on('connect', onSocketConnected);
        socketService.on('disconnect', onSocketDisconnected);

        socketService.on('newMessage', onNewMessage);
        socketService.on('receiveMessage', onNewMessage);
        socketService.on('incomingCall', onIncomingCall);
        socketService.on('incoming-call', onIncomingCall);
        socketService.on('reminder-due', onReminderDue);
        socketService.on('ai-reminder-due', onAIReminderDue);
        socketService.on('typing-start', onTypingStart);
        socketService.on('typing', onTypingAlias);
        socketService.on('typing-stop', onTypingStop);
        socketService.on('stopTyping', onStopTypingAlias);
        socketService.on('online-users', onOnlineUsers);
        socketService.on('message-delivered', onMessageDelivered);
        socketService.on('message-seen', onMessageSeen);
        socketService.on('callAnswered', onCallAnswered);
        socketService.on('callAccepted', onCallAnswered);
        socketService.on('call-accepted', onCallAnswered);
        socketService.on('iceCandidate', onIceCandidate);
        socketService.on('ice-candidate', onIceCandidate);
        socketService.on('callEnded', onCallEnded);
        socketService.on('call-ended', onCallEnded);
        socketService.on('call-rejected', onCallRejected);
        socketService.on('user-offline', onUserOffline);
        socketService.on('shareUpdated', onShareUpdated);

        return () => {
            socketService.off('connect', onSocketConnected);
            socketService.off('disconnect', onSocketDisconnected);
            socketService.off('newMessage', onNewMessage);
            socketService.off('receiveMessage', onNewMessage);
            socketService.off('incomingCall', onIncomingCall);
            socketService.off('incoming-call', onIncomingCall);
            socketService.off('reminder-due', onReminderDue);
            socketService.off('ai-reminder-due', onAIReminderDue);
            socketService.off('typing-start', onTypingStart);
            socketService.off('typing', onTypingAlias);
            socketService.off('typing-stop', onTypingStop);
            socketService.off('stopTyping', onStopTypingAlias);
            socketService.off('online-users', onOnlineUsers);
            socketService.off('message-delivered', onMessageDelivered);
            socketService.off('message-seen', onMessageSeen);
            socketService.off('callAnswered', onCallAnswered);
            socketService.off('callAccepted', onCallAnswered);
            socketService.off('call-accepted', onCallAnswered);
            socketService.off('iceCandidate', onIceCandidate);
            socketService.off('ice-candidate', onIceCandidate);
            socketService.off('callEnded', onCallEnded);
            socketService.off('call-ended', onCallEnded);
            socketService.off('call-rejected', onCallRejected);
            socketService.off('user-offline', onUserOffline);
            socketService.off('shareUpdated', onShareUpdated);
        };
    }, [applyRemoteDescription, cleanupCallMedia, clearRingTimeout, setAlert, user?._id, isAuthenticated, upsertSummary, addCallHistoryEntry, loadCallHistory, contactNameById]);

    useEffect(() => {
        if (!user?._id || !isAuthenticated) return;

        const onNotification = (payload: Partial<RealtimeNotification>) => {
            handleRealtimeNotification(payload);
        };

        socketService.off('notification');
        socketService.on('notification', onNotification);

        return () => {
            socketService.off('notification', onNotification);
        };
    }, [handleRealtimeNotification, isAuthenticated, user?._id]);

    useEffect(() => {
        if (isAuthenticated) return;
        socketService.disconnect();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!currentContactId) return;
        socketService.emit('join-chat', { contactId: currentContactId });
        if (user?._id) {
            socketService.emit('joinRoom', buildChatRoomId(user._id, currentContactId));
        }
        socketService.emit('mark-seen', { contactId: currentContactId });
        setUnreadByContact((prev) => ({ ...prev, [currentContactId]: 0 }));
        setChatSummaries((prev) => prev.map((item) => (item.userId === currentContactId ? { ...item, unreadCount: 0 } : item)));

        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/thread/${currentContactId}?limit=80`);
                setMessagesByContact((prev) => ({ ...prev, [currentContactId]: res.data }));
            } catch {
                try {
                    const fallback = await api.get(`/messages/${currentContactId}?limit=80`);
                    setMessagesByContact((prev) => ({ ...prev, [currentContactId]: fallback.data }));
                } catch {
                    setAlert?.('Unable to load chat messages', 'danger');
                }
            }
        };

        fetchMessages();
    }, [buildChatRoomId, currentContactId, setAlert, user?._id]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const loadDashboard = async () => {
            try {
                const res = await api.get('/dashboard');
                setDashboardInsights(res.data || null);
            } catch {
                setDashboardInsights(null);
            }
        };

        const loadAiReminders = async () => {
            try {
                const res = await api.get('/ai-reminders');
                setAiReminders(res.data || []);
            } catch {
                setAiReminders([]);
            }
        };

        loadDashboard();
        loadAiReminders();
        void loadCallHistory();
    }, [isAuthenticated, loadCallHistory]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const loadReminders = async () => {
            try {
                const res = await api.get('/reminders');
                setReminders(res.data || []);
            } catch {
                setAlert?.('Unable to load reminders', 'danger');
            }
        };
        loadReminders();
    }, [isAuthenticated, setAlert]);

    useEffect(() => {
        if (callStatus !== 'connected') return;
        const intervalId = window.setInterval(() => {
            setCallTimer((prev) => prev + 1);
        }, 1000);
        return () => window.clearInterval(intervalId);
    }, [callStatus]);

    useEffect(() => {
        if (callStatus !== 'ended' && callStatus !== 'failed') return;
        const timeoutId = window.setTimeout(() => {
            setCallError('');
            cleanupCallMedia('idle');
        }, 1100);
        return () => window.clearTimeout(timeoutId);
    }, [callStatus, cleanupCallMedia]);

    useEffect(() => () => {
        if (typingStopTimer.current) {
            window.clearTimeout(typingStopTimer.current);
        }
        cleanupCallMedia();
    }, [cleanupCallMedia]);

    useEffect(() => {
        if (!currentContactId) return;
        const box = chatScrollRef.current;
        if (box) {
            box.scrollTop = box.scrollHeight;
        }
    }, [currentContactId, messagesByContact, typingByContact]);

    const widgetCard = (title: string, value: string, icon: string) => (
        <PremiumWidget title={title} value={value} icon={icon} />
    );

        const renderDashboard = () => (
            <main className="p-6">
                <div className="flex flex-col gap-4">
                    <Section
                        title={`Welcome back, ${user?.name || "User"}!`}
                    subtitle="Here’s what’s happening today."
                    className=""
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:scale-[1.02] transition-all cursor-pointer" onClick={() => setActiveView('contacts')}>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs uppercase tracking-wider text-cyan-500">Quick Action</span>
                                <span className="flex items-center gap-2 text-lg font-semibold"><i className="fas fa-user-plus" /> Add Contact</span>
                                <span className="text-sm text-slate-400">Create and enrich your network instantly.</span>
                            </div>
                        </div>
                        <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:scale-[1.02] transition-all cursor-pointer" onClick={() => setActiveView('chat')}>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs uppercase tracking-wider text-cyan-500">Quick Action</span>
                                <span className="flex items-center gap-2 text-lg font-semibold"><i className="fas fa-comments" /> Start Chat</span>
                                <span className="text-sm text-slate-400">Open real-time conversations in one tap.</span>
                            </div>
                        </div>
                        <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:scale-[1.02] transition-all cursor-pointer" onClick={() => setActiveView('secure-links')}>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs uppercase tracking-wider text-cyan-500">Quick Action</span>
                                <span className="flex items-center gap-2 text-lg font-semibold"><i className="fas fa-link" /> Share Link</span>
                                <span className="text-sm text-slate-400">Generate secure, expiring access links.</span>
                            </div>
                        </div>
                        <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:scale-[1.02] transition-all cursor-pointer" onClick={() => setActiveView('vault')}>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs uppercase tracking-wider text-cyan-500">Quick Action</span>
                                <span className="flex items-center gap-2 text-lg font-semibold"><i className="fas fa-shield-halved" /> Secure Vault</span>
                                <span className="text-sm text-slate-400">Protect and access sensitive records safely.</span>
                            </div>
                        </div>
                    </div>
                </Section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="md:col-span-1 xl:col-span-2 flex flex-col gap-6">
                        <Section title="Recent Contacts" className="" headerRight={<StatusBadge label={`Total ${dashboardStats.totalContacts}`} />}>
                            <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                                <div className="flex flex-col gap-3">
                                    {normalizedContacts.slice(0, 5).map((contact) => (
                                        <ListItem key={String(contact._id || contact.phone || contact.name)} className="flex items-center justify-between gap-3 p-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <AppAvatar name={contact.name || 'U'} className="!w-10 !h-10" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-100 truncate">{contact.name}</p>
                                                    <p className="text-xs app-muted truncate">{contact.phone || 'No phone'}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs app-muted shrink-0">Last activity just now</p>
                                        </ListItem>
                                    ))}
                                    {normalizedContacts.length === 0 && <p className="text-sm app-muted py-4">No recent contacts yet.</p>}
                                </div>
                            </div>
                        </Section>
                        <Section title="Analytics Overview" className="">
                            <div className="rounded-2xl p-5 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                                <div className="h-44 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 flex items-end gap-2 p-3">
                                    {[ 
                                        'h-[26%]', 'h-[34%]', 'h-[31%]', 'h-[42%]', 'h-[48%]', 'h-[44%]',
                                        'h-[56%]', 'h-[53%]', 'h-[62%]', 'h-[58%]', 'h-[71%]', 'h-[66%]'
                                    ].map((heightClass, idx) => (
                                        <span key={idx} className={`flex-1 rounded-md bg-gradient-to-t from-cyan-500/30 via-blue-400/45 to-violet-400/70 ${heightClass}`} />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {widgetCard('Visitors', String((dashboardStats.totalContacts * 19) + 80), 'fa-chart-line')}
                                    {widgetCard('Shares', String((dashboardStats.activeChats * 7) + 24), 'fa-share-nodes')}
                                </div>
                            </div>
                        </Section>
                    </div>
                    <div className="md:col-span-1 xl:col-span-2">
                        {/* AI Panel or other widgets can go here */}
                    </div>
                </div>
            </div>
            </main>
        );

    const renderContacts = () => (
        <main className="p-6">
            <div className="flex flex-col gap-6 fade-in">
                <div className="glass-panel-strong p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold neon-title">Contact Tools</h3>
                    <p className="text-sm app-muted">Quickly generate secure, expiring links for contact sharing.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/share">
                        <Button className="glass-action text-slate-100 border-cyan-300/25">
                            <i className="fas fa-chart-line" />
                            My Shared Links
                        </Button>
                    </Link>
                    <Button
                        className="premium-share-cta"
                        onPress={() => openShareGenerator()}
                    >
                        <i className="fas fa-share-nodes" />
                        Smart Share Generator
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="xl:col-span-2">
                    <div className="glass-panel-strong p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold neon-title">Contacts</h3>
                            <p className="text-sm app-muted">Manage your contact list quickly and cleanly.</p>
                        </div>
                        <Button
                            className="premium-share-cta"
                            onPress={() => setShowAddContact(true)}
                        >
                            + Add Contact
                        </Button>
                    </div>
                    <ContactFilter />
                    <Contacts
                        onOpenChat={openChatFromContact}
                        onVoiceCall={(contact) => startCallFromContact(contact, 'audio')}
                        onVideoCall={(contact) => startCallFromContact(contact, 'video')}
                    />
                </div>
            </div>

            {showAddContact && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl glass-panel-strong p-6 shadow-2xl border border-cyan-300/20">
                        <ContactForm
                            onSaved={() => setShowAddContact(false)}
                            onCancel={() => setShowAddContact(false)}
                        />
                    </div>
                </div>
            )}
            </div>
        </main>
    );

    const renderChats = () => (
        <main className="p-6">
        <div className="fade-in min-h-[560px] w-full px-0 justify-start items-start">
            {!activeChatId && (
                <div className="glass-panel p-3">
                <h3 className="text-lg font-semibold neon-title px-2 py-2">Chat List</h3>
                <div className="flex flex-col gap-6">
                    {sortedChatThreads.length === 0 && <p className="text-sm app-muted p-2">No chats yet. Start a conversation from Contacts.</p>}
                    {sortedChatThreads.map((thread) => (
                        <div
                            key={thread.id}
                            role="button"
                            tabIndex={0}
                            className="w-full text-left glass-card p-3 cursor-pointer"
                            onClick={() => openChat({ id: thread.id, name: thread.name })}
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                openChat({ id: thread.id, name: thread.name });
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="avatar-orb !w-10 !h-10">{(thread.name?.charAt(0) || 'U').toUpperCase()}</div>
                                    <p className="font-semibold truncate">{thread.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {thread.isPinned && <i className="fas fa-thumbtack text-amber-300 text-xs" />}
                                    <span className="text-xs app-muted">{thread.time}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm app-muted truncate">{thread.lastMessage}</p>
                                <div className="flex items-center gap-2">
                                    {thread.unread > 0 && <span className="badge-pill">{thread.unread}</span>}
                                    <button
                                        type="button"
                                        className="glass-action !min-w-7 !w-7 !h-7 rounded-md"
                                        aria-label={thread.isPinned ? 'Unpin chat' : 'Pin chat'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleChatPin(thread.id);
                                        }}
                                    >
                                        <i className={`fas ${thread.isPinned ? 'fa-thumbtack' : 'fa-thumbtack'} text-[10px]`} />
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-action !min-w-7 !w-7 !h-7 rounded-md"
                                        aria-label={thread.isArchived ? 'Unarchive chat' : 'Archive chat'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleChatArchive(thread.id);
                                        }}
                                    >
                                        <i className={`fas ${thread.isArchived ? 'fa-box-open' : 'fa-box-archive'} text-[10px]`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {activeChatId && (
                <div className="fixed inset-0 z-[58] bg-slate-950/95 p-3 sm:p-4 md:p-6">
                    <div className="glass-panel h-full p-4 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        className="glass-action px-3 py-2 rounded-xl text-sm min-w-[80px]"
                        onClick={() => {
                            setActiveChatId('');
                        }}
                    >
                        <i className="fas fa-arrow-left" />
                        Back
                    </button>
                    <h3 className="text-lg font-semibold neon-title truncate">{currentContact?.name || 'Chat Window'}</h3>
                    <div className="flex items-center gap-2 min-w-[96px] justify-end">
                        <Button
                            isIconOnly
                            className="glass-action !min-w-9 !w-9 !h-9"
                            aria-label="Voice call"
                            onPress={() => {
                                if (!currentContactId) return;
                                void startOutgoingCall(currentContactId, 'audio', currentContact?.name || 'Unknown');
                            }}
                        >
                            <i className="fas fa-phone" />
                        </Button>
                        <Button
                            isIconOnly
                            className="glass-action !min-w-9 !w-9 !h-9"
                            aria-label="Video call"
                            onPress={() => {
                                if (!currentContactId) return;
                                void startOutgoingCall(currentContactId, 'video', currentContact?.name || 'Unknown');
                            }}
                        >
                            <i className="fas fa-video" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs app-muted">
                    {currentContactId && onlineUsers.includes(currentContactId) ? 'Online now' : 'Offline'}
                </p>
                <div className="chat-window flex-1 min-h-0" ref={chatScrollRef}>
                    {((messagesByContact[currentContactId] || []) as ChatMessage[]).slice(-50).map((message, idx) => (
                        <div key={`${message._id || message.clientMessageId || idx}`} className={`message-row ${message.sender === 'user' ? 'is-me' : 'is-them'}`}>
                            <div className="message-bubble">
                                {message.messageType === 'contact_share' ? (
                                    <div className="smart-share-chat-card flex flex-col gap-6">
                                        {message.sender === 'user' ? (
                                            <>
                                                <p className="font-semibold text-white">[ Shared Contact ]</p>
                                                <p className="text-sm text-cyan-100/90">Name: {message.sharedContactName || 'Contact'}</p>
                                                <p className="text-xs app-muted">Expires in: {formatShareExpiry(message.sharePayload?.expiresAt || message.shareExpiresAt || null)}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-white">[ 🔐 Contact Access ]</p>
                                                <p className="text-xs app-muted">Sensitive details are hidden. Use secure actions only.</p>
                                                {(() => {
                                                    const token = getShareToken(message);
                                                    const state = shareActionByToken[token] || 'idle';
                                                    const expiresAt = getShareExpiresAt(message);
                                                    const isExpired = Boolean(expiresAt && expiresAt.getTime() <= Date.now()) || state === 'expired';
                                                    const isUsed = state === 'used';
                                                    const disabled = state === 'loading' || isExpired || isUsed || state === 'invalid';

                                                    if (isExpired) {
                                                        return <p className="text-xs text-rose-300">❌ Access Expired</p>;
                                                    }
                                                    if (isUsed) {
                                                        return <p className="text-xs text-amber-300">⚠ One-time access already used</p>;
                                                    }

                                                    return (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                className="glass-action px-3 py-1 rounded-lg text-xs disabled:opacity-50"
                                                                onClick={() => {
                                                                    void consumeSharedContactAction(message, 'call');
                                                                }}
                                                            >
                                                                📞 Call
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                className="glass-action px-3 py-1 rounded-lg text-xs disabled:opacity-50"
                                                                onClick={() => {
                                                                    void consumeSharedContactAction(message, 'chat');
                                                                }}
                                                            >
                                                                💬 Chat
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <p>{message.text}</p>
                                        {message.isTemporary && message.expiresAt && (
                                            <p className="text-[11px] text-amber-300">Temporary message • expires {new Date(message.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        )}
                                    </div>
                                )}
                                <span className="text-[11px] app-muted flex items-center justify-end gap-1">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {message.sender === 'user' && (
                                        <span>
                                            {message.status === 'seen' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                    {typingByContact[currentContactId] && (
                        <div className="message-row is-them">
                            <div className="message-bubble">
                                <p className="text-sm app-muted">typing...</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="glass-action px-3 rounded-xl text-lg"
                        title="Share contact"
                        aria-label="Open contact share generator"
                        onClick={openInlineShareSheet}
                    >
                        🔗
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className={`glass-action px-2 py-2 rounded-lg text-xs ${temporaryMode ? 'ring-1 ring-amber-300/60' : ''}`}
                            onClick={() => setTemporaryMode((prev) => !prev)}
                        >
                            <i className="fas fa-hourglass-half" />
                            Temp
                        </button>
                        {temporaryMode && (
                            <select
                                className="glass-action px-2 py-2 rounded-lg text-xs"
                                value={String(temporaryMinutes)}
                                onChange={(event) => setTemporaryMinutes(Number(event.target.value) || 60)}
                            >
                                <option value="15">15m</option>
                                <option value="60">1h</option>
                                <option value="180">3h</option>
                                <option value="720">12h</option>
                            </select>
                        )}
                    </div>
                    <Input
                        value={chatInput}
                        onChange={(event) => {
                            const value = event.target.value;
                            setChatInput(value);
                            if (!currentContactId) return;

                            if (!isTyping) {
                                setIsTyping(true);
                                socketService.emit('typing-start', { contactId: currentContactId });
                                socketService.emit('typing', currentContactId);
                            }

                            if (typingStopTimer.current) {
                                window.clearTimeout(typingStopTimer.current);
                            }

                            typingStopTimer.current = window.setTimeout(() => {
                                setIsTyping(false);
                                socketService.emit('typing-stop', { contactId: currentContactId });
                                socketService.emit('stopTyping', currentContactId);
                            }, 1200);
                        }}
                        placeholder="Type a message"
                    />
                    <Button
                        className="neon-action px-5"
                        onPress={() => {
                            if (!chatInput.trim() || !currentContactId) return;
                            const messageText = chatInput.trim();
                            const clientMessageId = `msg-${Date.now()}`;
                            const expiresAt = temporaryMode
                                ? new Date(Date.now() + Math.floor(temporaryMinutes) * 60 * 1000).toISOString()
                                : null;
                            const optimistic: ChatMessage = {
                                contactId: currentContactId,
                                text: messageText,
                                sender: 'user',
                                createdAt: new Date().toISOString(),
                                clientMessageId,
                                isTemporary: temporaryMode,
                                expiresAt,
                            };
                            setMessagesByContact((prev) => ({
                                ...prev,
                                [currentContactId]: [...(prev[currentContactId] || []), optimistic],
                            }));
                            upsertSummary(currentContactId, {
                                name: currentContact?.name || 'Unknown User',
                                lastMessage: messageText,
                                updatedAt: optimistic.createdAt,
                                unreadCount: 0,
                            });
                            socketService.emit('sendMessage', {
                                senderId: user?._id,
                                receiverId: currentContactId,
                                message: messageText,
                                clientMessageId,
                                expiresInMinutes: temporaryMode ? temporaryMinutes : null,
                            });
                            console.info('Message sent', clientMessageId);
                            setIsTyping(false);
                            socketService.emit('typing-stop', { contactId: currentContactId });
                            socketService.emit('stopTyping', currentContactId);
                            setChatInput('');
                        }}
                    >
                        Send
                    </Button>
                </div>
            </div>
            </div>
            )}
        </div>
        </main>
    );

    const renderCalls = () => (
        <main className="p-6">
        <div className="glass-panel p-5 fade-in w-full px-0 justify-start items-start">
            <h3 className="text-xl font-semibold neon-title">Calls</h3>
            {incomingCall && (
                <div className="glass-card p-4">
                    <p className="font-semibold">Incoming {incomingCall.type === 'video' ? 'video' : 'voice'} call: {incomingCall.fromName || incomingCall.from}</p>
                    <div className="flex gap-2">
                        <Button
                            className="neon-action"
                            onPress={acceptIncomingCall}
                        >
                            Accept
                        </Button>
                        <Button
                            className="glass-action"
                            onPress={rejectIncomingCall}
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            )}
            {selectedCall && (
                <div className="glass-card p-4">
                    <p className="text-sm app-muted">Call actions</p>
                    <p className="font-semibold">{selectedCall.name}</p>
                    <div className="flex gap-2">
                        <Button
                            className="neon-action"
                            onPress={() => {
                                void startOutgoingCall(selectedCall.contactId, 'audio', selectedCall.name);
                            }}
                        >
                            Call Again
                        </Button>
                        <Button
                            className="neon-action"
                            onPress={() => {
                                void startOutgoingCall(selectedCall.contactId, 'video', selectedCall.name);
                            }}
                        >
                            Video
                        </Button>
                        <Button
                            variant="flat"
                            className="glass-action"
                            onPress={endCurrentCall}
                        >
                            End
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6">
                {callHistory.map((call) => {
                    const typeMeta = call.type === 'incoming'
                        ? { label: 'Incoming', icon: 'fa-arrow-down', color: 'text-emerald-400' }
                        : call.type === 'outgoing'
                            ? { label: 'Outgoing', icon: 'fa-arrow-up', color: 'text-sky-400' }
                            : { label: 'Missed', icon: 'fa-phone-slash', color: 'text-rose-400' };

                    return (
                        <div
                            key={call.id}
                            role="button"
                            tabIndex={0}
                            className={`w-full glass-card px-4 py-3 min-h-[72px] flex items-center justify-between gap-3 text-left cursor-pointer ${selectedCall?.id === call.id ? 'ring-1 ring-cyan-300/50' : ''}`}
                            onClick={() => {
                                setSelectedCall(call);
                                setCallPeerId(call.contactId);
                                setCallPeerName(call.name);
                                setActiveView('calls');
                            }}
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                setSelectedCall(call);
                                setCallPeerId(call.contactId);
                                setCallPeerName(call.name);
                                setActiveView('calls');
                            }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="avatar-orb !w-11 !h-11 text-base">{(call.name?.charAt(0) || 'U').toUpperCase()}</div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold truncate">{call.name}</h4>
                                    <p className="text-sm app-muted truncate">
                                        {typeMeta.label} • {new Date(call.time).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs app-muted">{call.duration > 0 ? `${Math.floor(call.duration / 60).toString().padStart(2, '0')}:${(call.duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                                <i className={`fas ${typeMeta.icon} ${typeMeta.color}`} />
                                <Button
                                    isIconOnly
                                    className="glass-action !min-w-9 !w-9 !h-9"
                                    aria-label="Call again"
                                    onPress={() => {
                                        void startOutgoingCall(call.contactId, 'audio', call.name);
                                    }}
                                >
                                    <i className="fas fa-phone" />
                                </Button>
                                <Button
                                    isIconOnly
                                    className="glass-action !min-w-9 !w-9 !h-9"
                                    aria-label="Video call"
                                    onPress={() => {
                                        void startOutgoingCall(call.contactId, 'video', call.name);
                                    }}
                                >
                                    <i className="fas fa-video" />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {callHistory.length === 0 && (
                    <div className="glass-card p-4 text-sm app-muted">No call history yet.</div>
                )}
            </div>
        </div>
        </main>
    );

    const renderReminders = () => (
        <main className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 fade-in w-full px-0 justify-items-start items-start">
            <div className="glass-panel p-4">
                <h3 className="text-lg font-semibold neon-title">Create Reminder</h3>
                <div className="flex flex-col gap-6">
                    <Input
                        value={reminderMessage}
                        onChange={(event) => setReminderMessage(event.target.value)}
                        placeholder="Message"
                    />
                    <Input
                        value={reminderContact}
                        onChange={(event) => setReminderContact(event.target.value)}
                        placeholder="Contact"
                    />
                    <Input
                        type="datetime-local"
                        value={reminderDateTime}
                        onChange={(event) => setReminderDateTime(event.target.value)}
                    />
                    <Button
                        className="neon-action w-full"
                        onPress={async () => {
                            if (!reminderMessage || !reminderContact || !reminderDateTime) return;
                            try {
                                const matchedContact = contacts.find((contact) => contact.name.toLowerCase() === reminderContact.toLowerCase());
                                const res = await api.post('/reminders', {
                                    message: reminderMessage,
                                    contactId: matchedContact?._id,
                                    remindAt: reminderDateTime,
                                    repeat,
                                });
                                setReminders((prev) => [res.data, ...prev]);
                            } catch {
                                setAlert?.('Failed to create reminder', 'danger');
                            }
                            setReminderMessage('');
                            setReminderContact('');
                            setReminderDateTime('');
                            setRepeat('none');
                        }}
                    >
                        Add Reminder
                    </Button>
                    <select
                        className="w-full p-2 rounded-xl border border-cyan-300/30 bg-transparent"
                        value={repeat}
                        onChange={(event) => setRepeat(event.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                    >
                        <option value="none">No Repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel p-4">
                <h3 className="text-lg font-semibold neon-title">Reminder Timeline</h3>
                <div className="flex flex-col gap-6">
                    {reminders.map((reminder) => (
                        <div key={reminder._id} className="glass-card p-3">
                            <p className="font-semibold">{reminder.message}</p>
                            <p className="text-sm app-muted">{contacts.find((contact) => contact._id === reminder.contactId)?.name || 'General'}</p>
                            <p className="text-xs app-muted">{new Date(reminder.remindAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </main>
    );

    const renderSettings = () => (
        <main className="p-6">
        <div className="glass-panel p-5 fade-in">
            <h3 className="text-xl font-semibold neon-title">Settings</h3>
            <p className="text-sm text-slate-300">Theme, notification, and profile controls stay available in your existing preferences flow.</p>
        </div>
        </main>
    );

    const renderSecureLinks = () => (
        <main className="p-6">
        <div className="flex flex-col gap-6 fade-in">
            <div className="glass-panel-strong p-5">
                <h3 className="text-xl font-semibold neon-title">Secure Links</h3>
                <p className="text-sm app-muted">Manage expiring links with one-tap sharing and instant revocation flows.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                    <PremiumCard key={item} className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-100">Contact Share #{item}</p>
                            <span className="badge-pill">active</span>
                        </div>
                        <p className="text-sm app-muted">Token expires in {item * 10} minutes. Shared with authenticated recipient only.</p>
                        <div className="flex gap-2">
                            <PremiumButton glow={false} size="sm">Copy</PremiumButton>
                            <PremiumButton glow={false} size="sm">Share</PremiumButton>
                        </div>
                    </PremiumCard>
                ))}
            </div>
        </div>
        </main>
    );

    const renderVault = () => (
        <main className="p-6">
        <div className="flex flex-col gap-6 fade-in w-full px-0 justify-items-start items-start">
            <div className="glass-panel-strong p-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-semibold neon-title">Smart Vault</h3>
                    <p className="text-sm app-muted">Encrypted-looking workspace for secure notes and attachments.</p>
                </div>
                <PremiumButton>
                    <i className="fas fa-plus" /> Add to Vault
                </PremiumButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumCard>
                    <p className="text-sm app-muted">Pinned Secure Notes</p>
                    <ul className="flex flex-col gap-6">
                        <li className="glass-card p-3"><i className="fas fa-note-sticky text-cyan-300" />Bank Manager Contact Strategy</li>
                        <li className="glass-card p-3"><i className="fas fa-note-sticky text-cyan-300" />Top 20 VIP Follow-up Plan</li>
                    </ul>
                </PremiumCard>
                <PremiumCard>
                    <p className="text-sm app-muted">Encrypted Assets</p>
                    <ul className="flex flex-col gap-6">
                        <li className="glass-card p-3 flex items-center justify-between"><span><i className="fas fa-file-lines text-violet-300" />nda_draft.pdf</span><span className="text-xs app-muted">2.4MB</span></li>
                        <li className="glass-card p-3 flex items-center justify-between"><span><i className="fas fa-file-audio text-violet-300" />client_call_note.m4a</span><span className="text-xs app-muted">7.1MB</span></li>
                    </ul>
                </PremiumCard>
            </div>
        </div>
        </main>
    );

    const renderAnalytics = () => (
        <main className="p-6">
        <div className="flex flex-col gap-6 fade-in w-full px-0 justify-items-start items-start">
            <div className="glass-panel-strong p-5">
                <h3 className="text-xl font-semibold neon-title">Analytics</h3>
                <p className="text-sm app-muted">Engagement and communication trends across contacts, calls, and reminders.</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <PremiumCard className="xl:col-span-2">
                    <p className="text-sm app-muted">Activity Trend</p>
                    <div className="h-40 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 flex items-end gap-2 p-3">
                        {[
                            'h-[35%]', 'h-[48%]', 'h-[30%]', 'h-[54%]', 'h-[66%]', 'h-[58%]',
                            'h-[72%]', 'h-[69%]', 'h-[61%]', 'h-[77%]', 'h-[81%]', 'h-[74%]'
                        ].map((heightClass, idx) => (
                            <span key={idx} className={`flex-1 rounded-md bg-gradient-to-t from-cyan-500/35 to-violet-400/75 ${heightClass}`} />
                        ))}
                    </div>
                </PremiumCard>
                <PremiumCard>
                    <p className="text-sm app-muted">Conversion Pulse</p>
                    <div className="flex flex-col gap-6">
                        <div className="glass-card p-3 flex items-center justify-between"><span>Replies</span><span className="text-cyan-200">82%</span></div>
                        <div className="glass-card p-3 flex items-center justify-between"><span>Calls Connected</span><span className="text-cyan-200">74%</span></div>
                        <div className="glass-card p-3 flex items-center justify-between"><span>Reminder Actions</span><span className="text-cyan-200">67%</span></div>
                    </div>
                </PremiumCard>
            </div>
        </div>
        </main>
    );

    const renderAIAssistantPanel = () => {
        const aiItems = (dashboardInsights?.aiSuggestions || []).slice(0, 3);
        const fallbackItems = [
            'Reconnect with contact',
            'Follow up with pending contacts',
            'Clean up contacts',
        ];
        const suggestionList = aiItems.length > 0 ? aiItems.map((item) => item.message) : fallbackItems;
        return (
            <aside className="right-ai-panel hidden xl:block">
                <div className="ai-float-orb" />
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-cyan-100 tracking-wide uppercase">Smart Suggestions</h4>
                    <StatusBadge label="Live" />
                </div>
                <p className="text-sm app-muted">Smart suggestions to reconnect, follow-up, and keep your contact graph clean.</p>
                <div className="flex flex-col gap-6">
                    {suggestionList.map((message, index) => (
                        <ListItem key={`${message}-${index}`} className="p-3">
                            <p className="text-sm text-slate-100">{message}</p>
                            <p className="text-xs app-muted uppercase">Priority: medium</p>
                        </ListItem>
                    ))}
                </div>
                <PremiumButton className="w-full">
                    <i className="fas fa-sparkles" /> Ask AI
                </PremiumButton>
            </aside>
        );
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return renderDashboard();
            case 'contacts':
                return renderContacts();
            case 'chat':
                return renderChats();
            case 'secure-links':
                return renderSecureLinks();
            case 'vault':
                return renderVault();
            case 'analytics':
                return renderAnalytics();
            case 'calls':
                return renderCalls();
            case 'reminder':
                return renderReminders();
            case 'settings':
                return renderSettings();
            default:
                return renderDashboard();
        }
    };

    if (!loading && !isAuthenticated) {
        return null;
    }

    return (
        <>
        <AppLayout
            sidebar={(
                <Sidebar
                    title="SmartContact"
                    subtitle="Management Workspace"
                    items={navItems}
                    activeKey={activeView}
                    open={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onSelect={(key) => setActiveView(key as ViewKey)}
                />
            )}
            topbar={(
                <Topbar
                    title={activeView.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    search={search}
                    searchPlaceholder={`Search ${activeView}...`}
                    onSearchChange={setSearch}
                    onSearchClear={() => setSearch('')}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    searchNode={(
                        <div className="topbar-search mx-auto">
                            <PremiumInput
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={`Search ${activeView}...`}
                                startContent={<i className="fas fa-magnifying-glass text-slate-400" />}
                                isClearable
                                onClear={() => setSearch('')}
                                classNames={{
                                    inputWrapper: "bg-transparent shadow-none !border-none group-data-[focus=true]:bg-transparent hover:bg-transparent px-2 h-10",
                                    input: "text-sm text-slate-100 placeholder:text-slate-400",
                                }}
                            />
                        </div>
                    )}
                    actions={(
                        <div className="flex items-center justify-end gap-1.5">
                        <div className="relative">
                            <Button
                                isIconOnly
                                variant="light"
                                className="text-slate-300 hover:text-cyan-200"
                                aria-label="Notifications"
                                onPress={() => {
                                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                                        void Notification.requestPermission();
                                    }
                                    setShowNotificationPanel((prev) => {
                                        const next = !prev;
                                        if (next) {
                                            setNotificationBadgeCount(0);
                                        }
                                        return next;
                                    });
                                }}
                            >
                                <i className="fas fa-bell text-lg" />
                                {notifCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_theme('colors.rose.500')]" />
                                )}
                            </Button>
                            
                            {showNotificationPanel && (
                                        <div className="absolute right-0 top-14 w-80 sm:w-96 glass-panel-strong border border-cyan-300/20 shadow-2xl z-50 p-4 animate-fade-in origin-top-right">
                                    <div className="flex items-center justify-between pb-3 border-b border-cyan-300/15">
                                        <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                            <i className="fas fa-bell text-cyan-500" /> Notifications
                                        </p>
                                        <button
                                            className="text-xs font-medium text-slate-300 hover:text-cyan-200 transition-colors"
                                            onClick={() => {
                                                setNotifications([]);
                                                setNotificationBadgeCount(0);
                                            }}
                                        >
                                            Dismiss All
                                        </button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto flex flex-col gap-6 pr-1 custom-scrollbar">
                                        {notifications.length === 0 && (
                                            <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <i className="far fa-bell-slash text-2xl opacity-50" />
                                                <p className="text-sm font-medium">All caught up!</p>
                                            </div>
                                        )}
                                        {notifications.map((notification) => (
                                            <button
                                                key={notification.id}
                                                className="w-full text-left p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 border border-transparent hover:border-cyan-300/25 transition-all group"
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">{notification.title}</p>
                                                <p className="text-xs font-medium text-slate-300 line-clamp-2">{notification.body}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <Button isIconOnly variant="light" className="text-slate-300 hover:text-cyan-200" aria-label="Messages">
                            <i className="fas fa-envelope text-lg" />
                        </Button>
                        <ThemeSwitch />
                        <div className="flex items-center gap-2">
                            <AppAvatar className="!w-9 !h-9 border-2 border-cyan-300/30 shadow-cyan-500/30 cursor-pointer" name={user?.name || 'U'} />
                            <span className="hidden lg:inline text-sm text-slate-200 font-medium">{user?.name || 'User'}</span>
                        </div>
                    </div>
                    )}
                />
            )}
            rightPanel={renderAIAssistantPanel()}
        >
            {renderContent()}
        </AppLayout>

            {showSharePopup && (
                <div
                    className="fixed inset-0 z-[70] bg-slate-950/40 fade-in"
                    onClick={() => setShowSharePopup(false)}
                >
                    <div
                        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl h-[46vh] rounded-t-3xl border border-cyan-300/25 bg-slate-900/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 overflow-y-auto"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-base sm:text-lg font-semibold text-white">Share Contact</h4>
                            <button
                                type="button"
                                className="glass-action px-3 py-1 rounded-lg text-xs"
                                onClick={() => setShowSharePopup(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <p className="text-xs app-muted">1. Select Contact</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-28 overflow-y-auto pr-1">
                                    {contacts.filter((contact) => Boolean(contact._id)).slice(0, 12).map((contact) => {
                                        const selected = String(shareContactId) === String(contact._id);
                                        return (
                                            <button
                                                key={contact._id}
                                                type="button"
                                                className={`text-left px-3 py-2 rounded-xl border text-sm truncate transition-all ${selected
 ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-300/60'
 : 'border-cyan-300/20 bg-slate-800/70 text-slate-200 hover:border-cyan-300/50'}`}
                                                onClick={() => setShareContactId(String(contact._id))}
                                            >
                                                {contact.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs app-muted">2. Expiry</p>
                                <div className="flex gap-2">
                                    {([
                                        { id: '5m', label: '5 min' },
                                        { id: '10m', label: '10 min' },
                                        { id: '1h', label: '1 hr' },
                                    ] as Array<{ id: SharePreset; label: string }>).map((item) => {
                                        const selected = sharePreset === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`px-3 py-2 rounded-xl text-sm border transition-all ${selected
 ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
 : 'border-cyan-300/25 text-slate-200 hover:border-cyan-300/50'}`}
                                                onClick={() => setSharePreset(item.id)}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="glass-card p-3">
                                <p className="text-xs app-muted">Preview</p>
                                <p className="text-sm text-slate-100">Sharing: {contacts.find((item) => String(item?._id) === String(shareContactId))?.name || '--'}</p>
                                <p className="text-sm text-slate-100">Expires: {sharePreset === '5m' ? '5 min' : sharePreset === '1h' ? '1 hr' : '10 min'}</p>
                            </div>

                            <div>
                                <p className="text-xs app-muted">3. Send</p>
                                <Button
                                    className="premium-share-cta w-full"
                                    isDisabled={isCreatingShare}
                                    onPress={async () => {
                                        const minutes = toShareMinutes();
                                        if (!activeChatId) {
                                            setAlert?.('Open a chat first', 'warning');
                                            return;
                                        }
                                        if (!shareContactId) {
                                            setAlert?.('Select a contact', 'warning');
                                            return;
                                        }

                                        const shared = contacts.find((contact) => String(contact._id) === String(shareContactId));
                                        if (!shared) {
                                            setAlert?.('Select a contact', 'warning');
                                            return;
                                        }

                                        try {
                                            setIsCreatingShare(true);
                                            const res = await api.post(
                                                '/share/create',
                                                {
                                                    contactId: shareContactId,
                                                    receiverId: activeChatId,
                                                    expiresInMinutes: minutes,
                                                    isOneTime: shareIsOneTime,
                                                }
                                            );

                                            const generated = {
                                                token: res.data.token,
                                                expiresAt: res.data.expiresAt,
                                                contactId: shareContactId,
                                                contactName: shared.name,
                                            };

                                            setShareResult(generated);
                                            pushShareToChat(activeChatId, generated);

                                            const storageKey = user?._id ? `last-share-contact:${user._id}` : 'last-share-contact';
                                            localStorage.setItem(storageKey, String(shareContactId));

                                            setShowSharePopup(false);
                                            showToast('✅ Contact Shared', {
                                                type: 'message',
                                                title: 'Contact Share',
                                                contactId: activeChatId,
                                            });
                                        } catch {
                                            setAlert?.('Failed to generate secure share link', 'danger');
                                        } finally {
                                            setIsCreatingShare(false);
                                        }
                                    }}
                                >
                                    {isCreatingShare ? 'Sending...' : 'Send 🔐'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed top-20 right-4 z-50 flex flex-col gap-6 w-80 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="toast glass-panel p-3 pointer-events-auto">
                        <p className="text-sm font-semibold">🔔 {toast.title}</p>
                        <p className="text-xs app-muted">{toast.body}</p>
                    </div>
                ))}
            </div>

            {(callStatus !== 'idle' || Boolean(incomingCall)) && (
                <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-sm flex flex-col transition-all duration-300">
                    <div className="px-5 sm:px-8 pt-6 pb-3 flex items-start justify-between text-slate-100">
                        <div>
                            <p className="text-xl sm:text-2xl font-semibold tracking-wide">
                                {callPeerName || incomingCall?.fromName || incomingCall?.from || 'Unknown'}
                            </p>
                            <p className="text-sm text-cyan-200/90 capitalize">
                                {callStatus === 'connected'
                                    ? `Connected • ${formatCallTimer(callTimer)}`
                                    : callStatus === 'incoming'
                                        ? 'Incoming'
                                        : callStatus === 'calling'
                                            ? 'Calling'
                                            : callStatus === 'ringing'
                                                ? 'Ringing'
                                                : callStatus === 'failed'
                                                    ? 'Call failed'
                                                    : callStatus === 'ended'
                                                        ? 'Call ended'
                                                        : 'Calling'}
                            </p>
                            {callError && <p className="text-xs text-rose-300">{callError}</p>}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300">{callMode === 'video' ? 'Video' : 'Voice'} Call</p>
                    </div>

                    <div className="flex-1 px-4 sm:px-8 pb-4 flex items-center justify-center">
                        {callMode === 'video' ? (
                            <div className="w-full max-w-6xl h-full grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 opacity-100">
                                <div className="relative glass-panel p-2 min-h-[220px] md:min-h-[360px] overflow-hidden">
                                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl bg-slate-900" />
                                    <span className="absolute left-4 top-3 text-xs px-2 py-1 rounded-full bg-black/45 text-white">Remote</span>
                                </div>
                                <div className="relative glass-panel p-2 min-h-[220px] md:min-h-[360px] overflow-hidden">
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl bg-slate-900" />
                                    <span className="absolute left-4 top-3 text-xs px-2 py-1 rounded-full bg-black/45 text-white">You</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-xl h-full flex flex-col items-center justify-center gap-6 transition-all duration-300">
                                <div className="avatar-orb !w-36 !h-36 sm:!w-44 sm:!h-44 text-5xl sm:text-6xl shadow-[0_0_55px_-14px_rgba(34,179,239,0.95)]">
                                    {(callPeerName || incomingCall?.fromName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
                                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                                {(callStatus === 'ringing' || callStatus === 'incoming') && (
                                    <p className="text-sm text-cyan-200 animate-pulse">Waiting for connection...</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="px-4 sm:px-8 pb-8 pt-2">
                        {callStatus === 'incoming' && incomingCall ? (
                            <div className="mx-auto w-full max-w-xl glass-panel rounded-2xl p-5 transition-all duration-300">
                                <p className="text-lg font-semibold text-slate-100">Incoming Call</p>
                                <p className="text-sm app-muted">{incomingCall.fromName || incomingCall.from || 'Unknown'}</p>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        className="px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:brightness-110 transition-all"
                                        onClick={acceptIncomingCall}
                                    >
                                        <i className="fas fa-phone" />Accept
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-3 rounded-full bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all"
                                        onClick={rejectIncomingCall}
                                    >
                                        <i className="fas fa-phone-slash" />Reject
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto w-full max-w-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300">
                                <button
                                    type="button"
                                    className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[84px] sm:min-w-[98px] text-xs sm:text-sm transition-all ${isMuted ? 'ring-1 ring-amber-300/60 bg-amber-400/10' : ''}`}
                                    onClick={toggleMute}
                                >
                                    {isMuted ? '🔇 Unmute' : '🔇 Mute'}
                                </button>
                                <button
                                    type="button"
                                    className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[84px] sm:min-w-[98px] text-xs sm:text-sm transition-all ${isCameraOff ? 'ring-1 ring-amber-300/60 bg-amber-400/10' : ''}`}
                                    onClick={toggleCamera}
                                >
                                    {isCameraOff ? '🎥 On' : '🎥 Off'}
                                </button>
                                <button
                                    type="button"
                                    className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[90px] sm:min-w-[106px] text-xs sm:text-sm transition-all ${isSpeakerOn ? 'ring-1 ring-cyan-300/55 bg-cyan-500/10' : ''}`}
                                    onClick={toggleSpeaker}
                                >
                                    {isSpeakerOn ? '🔊 Speaker' : '🔈 Speaker'}
                                </button>
                                <button
                                    type="button"
                                    className="px-4 sm:px-5 py-3 rounded-full min-w-[92px] sm:min-w-[110px] bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all"
                                    onClick={endCurrentCall}
                                >
                                    ❌ End
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            </>

    );
};

export default Home;
