
"use client";



import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Link as LinkIcon,
  Shield,
  PieChart,
  Phone,
  Bell,
  Settings,
} from "lucide-react";

import api from "../../utils/api";
const Contacts = dynamic(() => import("../contacts/Contacts"));
const ContactForm = dynamic(() => import("../contacts/ContactForm"));
const ContactFilter = dynamic(() => import("../contacts/ContactFilter"));

import { AuthContext } from "../../context/auth/AuthContext";
import { ContactContext } from "../../context/contact/ContactContext";
import { AlertContext } from "../../context/alert/AlertContext";
import { ThemeSwitch } from "../theme-switch";
import socketService from "../../utils/socketService";
import { encryptMessage, generateKey, exportKey, importKey, decryptMessage } from "../../utils/e2ee";
import PremiumButton from "../design/PremiumButton";
import PremiumInput from "../design/PremiumInput";
import PremiumWidget from "../design/PremiumWidget";
import PremiumCard from "../design/PremiumCard";
import AppLayout from "../layout/AppLayout";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import AppAvatar from "../design/AppAvatar";
import StatusBadge from "../design/StatusBadge";
const ShareGeneratorPage = dynamic(() => import("./ShareGeneratorPage"));

type ViewKey =
  | "dashboard"
  | "contacts"
  | "chat"
  | "secure-links"
  | "vault"
  | "analytics"
  | "calls"
  | "reminder"
  | "settings";

const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: React.ElementType;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "chat", label: "Chats", icon: MessageSquare },
  { key: "secure-links", label: "Secure Links", icon: LinkIcon },
  { key: "vault", label: "Smart Vault", icon: Shield },
  { key: "analytics", label: "Analytics", icon: PieChart },
  { key: "calls", label: "Calls", icon: Phone },
  { key: "reminder", label: "Reminders", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

type ChatMessage = {
    // E2EE fields for encrypted messages (optional)
    message?: number[];
    iv?: number[];
    key?: number[];
  _id?: string;
  contactId: string;
  senderId?: string;
  receiverId?: string;
  chatRoomId?: string;
  messageType?: "text" | "contact_share";
  text: string;
  sender: "user" | "contact";
  createdAt: string;
  clientMessageId?: string;
  sharedContactId?: string | null;
  shareToken?: string | null;
  shareLink?: string | null;
  sharedContactName?: string | null;
  shareExpiresAt?: string | null;
  sharePayload?: {
    type: "contact_share";
    contactId: string;
    token: string;
    expiresAt: string;
  } | null;
  status?: "sent" | "delivered" | "seen";
  deliveredAt?: string | null;
  seenAt?: string | null;
  isTemporary?: boolean;
  expiresAt?: string | null;
};

type IncomingCallPayload = {
  from: string;
  fromName?: string;
  offer?: RTCSessionDescriptionInit;
  signal?: RTCSessionDescriptionInit;
  type?: "audio" | "video";
};

type DashboardInsights = {
  totalContacts: number;
  activeContacts: number;
  inactiveContacts: number;
  pendingFollowUps: number;
  mostContacted: { name: string; frequency: number } | null;
  leastContacted: { name: string; frequency: number } | null;
  topContacts: Array<{
    _id: string;
    name: string;
    frequency: number;
    priorityLabel: string;
  }>;
  needsAttention: Array<{
    _id: string;
    name: string;
    missedCallCount: number;
    priorityLabel: string;
  }>;
  aiSuggestions: Array<{
    contactId: string;
    message: string;
    priority: "low" | "medium" | "high";
  }>;
};

type AIReminder = {
  _id: string;
  message: string;
  priority: "low" | "medium" | "high";
  category: string;
  isRead?: boolean;
  contactId?: string | null;
  createdAt: string;
};

type RealtimeNotification = {
  id: string;
  type: "message" | "call" | "reminder";
  title: string;
  body: string;
  senderId?: string;
  contactId?: string;
  createdAt: string;
};

type SharePreset = "5m" | "10m" | "1h";

type Reminder = {
  _id: string;
  message: string;
  contactId?: string;
  remindAt: string;
  repeat:
    | "none"
    | "today"
    | "tomorrow"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
    | "daily"
    | "weekly"
    | "monthly";
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
  type: "incoming" | "outgoing" | "missed";
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
  status?: "active" | "viewed" | "expired";
  isActive?: boolean;
  expiresAt?: string;
};

const Home = ({ hideAIPanel = false }: { hideAIPanel?: boolean }) => {
    // Toast notification state (fixes ReferenceError: setToasts is not defined)
    const [toasts, setToasts] = useState<any[]>([]);
    // Server time sync for expiry accuracy
    const [timeOffset, setTimeOffset] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const syncWithServer = useCallback((serverTime: string | Date | undefined | null) => {
      if (!serverTime) return;
      const serverDate = new Date(serverTime);
      const offset = serverDate.getTime() - Date.now();
      setTimeOffset(offset);
      setCurrentTime(new Date(Date.now() + offset));
    }, []);
  const authContext = useContext(AuthContext);
  const contactContext = useContext(ContactContext);
  const alertContext = useContext(AlertContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { loadUser, loading, isAuthenticated, user, logout } =
    authContext || {};
  const { contacts = [], current, clearCurrent } = contactContext || {};
  const { setAlert } = alertContext || {};
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [activeChatId, setActiveChatId] = useState("");
  const activeChatIdRef = useRef("");
  const activeViewRef = useRef<ViewKey>("dashboard");
  const contactsRef = useRef(contacts);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Editable profile state for settings page (must be at top level)
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");

  // Keep form in sync with user context
  useEffect(() => {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setEditPhone(user?.phone || "");
  }, [user?.name, user?.email, user?.phone]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);
  // Add notifications state for bell icon and notification panel
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  // Consolidated Real-time Notifications (Messages, Reminders, etc.)
  useEffect(() => {
    function handleNotification(payload: RealtimeNotification) {
      console.log("[Socket] Global Notification:", payload.type);
      
      // Handle Reminders
      if (payload.type === "reminder") {
        setToasts((prev) => [payload, ...prev]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== payload.id));
        }, 5000);
        return;
      }

      // Handle raw notifications (fallback for simple alerts)
      if (payload.type === "message") {
        // This is a secondary notification source, onNewMessage handles most cases.
        // We only use this if we want to bypass the heavy normalization logic.
      }
    }
    
    socketService.on("notification", handleNotification);
    return () => {
      socketService.off("notification", handleNotification);
    };
  }, []);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // Periodically refresh currentTime to force UI updates for expiration badges
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date(Date.now() + timeOffset));
    }, 10000); // 10s resolution
    return () => clearInterval(timer);
  }, [timeOffset]);

  const [chatInput, setChatInput] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderContact, setReminderContact] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [repeat, setRepeat] = useState<
    | "none"
    | "today"
    | "tomorrow"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
    | "daily"
    | "weekly"
    | "monthly"
  >("none");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [messagesByContact, setMessagesByContact] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [unreadByContact, setUnreadByContact] = useState<
    Record<string, number>
  >({});
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [chatMetaById, setChatMetaById] = useState<
    Record<string, ChatThreadMeta>
  >({});
  const [temporaryMode, setTemporaryMode] = useState(false);
  const [temporaryMinutes, setTemporaryMinutes] = useState(60);
  const [callStatus, setCallStatus] = useState<
    | "idle"
    | "calling"
    | "ringing"
    | "incoming"
    | "connected"
    | "ended"
    | "failed"
  >("idle");
  const [callTimer, setCallTimer] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null,
  );
  const [callPeerId, setCallPeerId] = useState<string>("");
  const [callPeerName, setCallPeerName] = useState("");
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing">(
    "outgoing",
  );
  const [callMode, setCallMode] = useState<"audio" | "video">("audio");
  // State for showing/hiding call chat panel
  const [showCallChat, setShowCallChat] = useState(true);
  // State for call chat input
  const [callChatInput, setCallChatInput] = useState("");
  const [callError, setCallError] = useState("");
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(
    null,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareContactId, setShareContactId] = useState("");
  const [sharePreset, setSharePreset] = useState<SharePreset>("10m");
  const [shareResult, setShareResult] = useState<ShareGenerationResult | null>(
    null,
  );
  const [shareIsOneTime, setShareIsOneTime] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareActionByToken, setShareActionByToken] = useState<
    Record<string, "idle" | "loading" | "expired" | "used" | "invalid">
  >({});
  const [typingByContact, setTypingByContact] = useState<
    Record<string, boolean>
  >({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [dashboardInsights, setDashboardInsights] =
    useState<DashboardInsights | null>(null);
  const [aiReminders, setAiReminders] = useState<AIReminder[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  // State for editing dashboard contacts (must be at top level)
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const typingStopTimer = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescriptionRef = useRef(false);
  const callRingTimeoutRef = useRef<number | null>(null);
  const callDisconnectTimeoutRef = useRef<number | null>(null);
  const incomingRingIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastIncomingCallRef = useRef<{ key: string; at: number }>({
    key: "",
    at: 0,
  });
  const callAcceptedRef = useRef(false);
  const deepLinkHandledRef = useRef("");
  const callSnapshotRef = useRef<{
    callPeerId: string;
    callPeerName: string;
    callStatus:
      | "idle"
      | "calling"
      | "ringing"
      | "incoming"
      | "connected"
      | "ended"
      | "failed";
    callDirection: "incoming" | "outgoing";
    callTimer: number;
  }>({
    callPeerId: "",
    callPeerName: "",
    callStatus: "idle",
    callDirection: "outgoing",
    callTimer: 0,
  });

  const notifCount = notificationBadgeCount;
  const currentContactId = activeChatId;

  // Auto-consume shared contact action if redirected from share link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const contactId = params.get("contactId");
    // Check if a share token is present in sessionStorage (set by share link flow)
    const shareToken = sessionStorage.getItem("pendingShareToken");
    const shareAction = sessionStorage.getItem("pendingShareAction");

    if (
      (view === "chat" || view === "call") &&
      contactId &&
      shareToken &&
      shareAction
    ) {
      // Try to get expiresAt from sessionStorage or fallback to a default (5 min from now)
      let expiresAt = sessionStorage.getItem("pendingShareExpiresAt");
      if (!expiresAt) {
        // fallback: 5 minutes from now
        expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      }
      const message = {
        contactId,
        shareToken,
        sharePayload: {
          type: "contact_share" as "contact_share",
          token: shareToken,
          expiresAt,
          contactId,
        },
        shareExpiresAt: expiresAt,
        text: "",
        sender: "user" as "user",
        createdAt: new Date().toISOString(),
      };

      // Only consume once
      sessionStorage.removeItem("pendingShareToken");
      sessionStorage.removeItem("pendingShareAction");
      sessionStorage.removeItem("pendingShareExpiresAt");

      // If the action is 'call', immediately trigger the call and skip contact details UI
      if (shareAction === "call") {
        // Directly consume and start the call, do not show contact details
        consumeSharedContactAction(message, "call");
        // Optionally, you can set a state to hide any contact info UI if needed
        setActiveView("calls");
      } else {
        consumeSharedContactAction(message, shareAction as "chat" | "call");
      }
    }
  }, []);

  const formatCallTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  };

  const clearRingTimeout = useCallback(() => {
    if (callRingTimeoutRef.current) {
      window.clearTimeout(callRingTimeoutRef.current);
      callRingTimeoutRef.current = null;
    }
  }, []);

  const clearDisconnectTimeout = useCallback(() => {
    if (callDisconnectTimeoutRef.current) {
      window.clearTimeout(callDisconnectTimeoutRef.current);
      callDisconnectTimeoutRef.current = null;
    }
  }, []);

  const playSystemTone = useCallback(
    (frequency = 880, durationSec = 0.18, volume = 0.06) => {
      try {
        if (typeof window === "undefined") return;
        const AnyWindow = window as Window &
          typeof globalThis & { webkitAudioContext?: typeof AudioContext };
        const Ctx = window.AudioContext || AnyWindow.webkitAudioContext;

        if (!Ctx) return;

        if (
          !audioContextRef.current ||
          audioContextRef.current.state === "closed"
        ) {
          audioContextRef.current = new Ctx();
        }

        const ctx = audioContextRef.current;

        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(volume, 0.01),
          now + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
        oscillator.start(now);
        oscillator.stop(now + durationSec + 0.02);
      } catch {
        // Optional audio cue only.
      }
    },
    [],
  );

  const stopIncomingRingtone = useCallback(() => {
    if (incomingRingIntervalRef.current) {
      window.clearInterval(incomingRingIntervalRef.current);
      incomingRingIntervalRef.current = null;
    }
  }, []);

  const startIncomingRingtone = useCallback(() => {
    stopIncomingRingtone();
    playSystemTone(820, 0.18, 0.07);
    window.setTimeout(() => playSystemTone(640, 0.2, 0.07), 220);
    incomingRingIntervalRef.current = window.setInterval(() => {
      playSystemTone(820, 0.18, 0.07);
      window.setTimeout(() => playSystemTone(640, 0.2, 0.07), 220);
    }, 1600);
  }, [playSystemTone, stopIncomingRingtone]);

  const toShareMinutes = () => {
    if (sharePreset === "5m") return 5;
    if (sharePreset === "10m") return 10;
    if (sharePreset === "1h") return 60;

    return 10;
  };

  const getShareToken = (message: ChatMessage) =>
    message.sharePayload?.token || message.shareToken || "";

  const getShareExpiresAt = (message: ChatMessage) => {
    const value =
      message.sharePayload?.expiresAt || message.shareExpiresAt || null;

    if (!value) return null;
    const date = new Date(value);
    // If the date is invalid (e.g. string missing Z), it might default to 1970
    return isNaN(date.getTime()) ? null : date;
  };

  const formatShareExpiry = (value?: string | null) => {
    if (!value) return "Unknown"; // For old messages without metadata
    const expiryDate = new Date(value);
    if (isNaN(expiryDate.getTime())) return "Unknown";
    const now = new Date(Date.now() + timeOffset);
    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    const mins = Math.ceil(diffMs / (60 * 1000));
    if (mins < 60) return `${mins} min`;
    const hours = Math.ceil(mins / 60);
    return `${hours} hr`;
  };

  const openShareGenerator = useCallback(
    (preferredContactId?: string) => {
      const params = new URLSearchParams();

      if (activeChatId) params.set("receiverId", activeChatId);
      if (preferredContactId) params.set("contactId", preferredContactId);
      const query = params.toString();

      router.push(query ? `/share-generator?${query}` : "/share-generator");
    },
    [activeChatId, router],
  );

  const upsertSummary = useCallback(
    (userId: string, data: Partial<ChatSummary>) => {
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
            name: data.name || "Unknown User",
            lastMessage: data.lastMessage || "",
            updatedAt: data.updatedAt || new Date().toISOString(),
            unreadCount: data.unreadCount ?? 0,
          },
          ...prev,
        ];
      });
    },
    [],
  );

  const pushShareToChat = useCallback(
    (targetId: string, data: ShareGenerationResult) => {
      const targetName =
        chatSummaries.find((summary) => summary.userId === targetId)?.name ||
        "Unknown User";
      // Always ensure expiresAt is a valid ISO string
      let expiresAt = data.expiresAt;
      if (!expiresAt || isNaN(new Date(expiresAt).getTime())) {
        // fallback: 5 minutes from now
        expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      }
      const payload: ChatMessage = {
        contactId: targetId,
        messageType: "contact_share",
        text: "Contact access granted",
        sender: "user",
        createdAt: new Date().toISOString(),
        clientMessageId: `share-${Date.now()}`,
        sharedContactId: data.contactId,
        shareToken: data.token,
        sharedContactName: data.contactName,
        shareExpiresAt: expiresAt,
        sharePayload: {
          type: "contact_share",
          contactId: data.contactId,
          token: data.token,
          expiresAt,
        },
      };

      setMessagesByContact((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), payload],
      }));
      upsertSummary(targetId, {
        name: targetName,
        lastMessage: "Contact access granted",
        updatedAt: payload.createdAt,
        unreadCount: 0,
      });

      // E2EE: Encrypt message before sending
      (async () => {
        // For demo: generate a new key per message (in production, use a shared key per chat)
        let key = await generateKey();
        const { ciphertext, iv } = await encryptMessage(key, payload.text);
        const exportedKey = await exportKey(key);
        socketService.emit("sendMessage", {
          senderId: user?._id,
          receiverId: targetId,
          message: Array.from(ciphertext), // send as array for JSON
          iv: Array.from(iv),
          key: Array.from(new Uint8Array(exportedKey)),
          clientMessageId: payload.clientMessageId,
          messageType: "contact_share",
          sharedContactId: payload.sharedContactId,
          shareToken: payload.shareToken,
          sharedContactName: payload.sharedContactName,
          shareExpiresAt: payload.shareExpiresAt,
          sharePayload: payload.sharePayload,
        });
      })();
    },
    [chatSummaries, upsertSummary, user?._id],
  );

  const consumeSharedContactAction = async (
    message: ChatMessage,
    action: "call" | "chat",
  ) => {
    const token = getShareToken(message);

    if (!token || !currentContactId) return;

    const expiresAt = getShareExpiresAt(message);
    const now = new Date(Date.now() + timeOffset);
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      setShareActionByToken((prev) => ({ ...prev, [token]: "expired" }));
      setAlert?.("Access expired", "warning");
      return;
    }

    setShareActionByToken((prev) => ({ ...prev, [token]: "loading" }));
    try {
      const res = await api.post(`/share/${token}/access`, { action });
      const status = String(res?.data?.status || "active");

      if (status === "expired") {
        setShareActionByToken((prev) => ({ ...prev, [token]: "expired" }));
        setAlert?.("Access expired", "warning");

        return;
      }

      // If contact details are returned, temporarily add to contacts state if not present
      if (
        res?.data?.contact &&
        !contacts.find((c) => c._id === res.data.contact._id)
      ) {
        contactContext?.addContact?.(res.data.contact);
      }

      if (!res?.data?.isActive && res?.data?.isOneTime) {
        setShareActionByToken((prev) => ({ ...prev, [token]: "used" }));
      } else {
        setShareActionByToken((prev) => ({ ...prev, [token]: "idle" }));
      }

      if (action === "call") {
        const contactData = res?.data?.contact;
        // Use top-level linkedUserId first (set by server to share.senderId)
        // then fall back through contact object fields
        const callTargetId =
          res?.data?.linkedUserId ||
          contactData?.linkedUserId ||
          contactData?.userId ||
          contactData?._id ||
          currentContactId;
        const callTargetName =
          res?.data?.name ||
          contactData?.name ||
          contacts.find((item) => String(item?._id) === String(callTargetId))?.name ||
          "Unknown";

        console.log("[Call] Starting call via share token to userId:", callTargetId, "name:", callTargetName);
        void startOutgoingCall(String(callTargetId), "audio", callTargetName);

        return;
      }
      setActiveView("chat");
      setActiveChatId(currentContactId);
      setAlert?.("Secure chat access granted", "success");
    } catch (err: any) {
      const statusCode = err?.response?.status;

      if (statusCode === 410) {
        setShareActionByToken((prev) => ({ ...prev, [token]: "expired" }));
        setAlert?.("Access expired", "warning");
      } else if (statusCode === 403 || statusCode === 404) {
        setShareActionByToken((prev) => ({ ...prev, [token]: "invalid" }));
        setAlert?.("Access denied for this token", "danger");
      } else {
        setShareActionByToken((prev) => ({ ...prev, [token]: "invalid" }));
        setAlert?.("Unable to validate secure access", "danger");
      }
    }
  };

  const buildChatRoomId = useCallback(
    (a: string, b: string) => `chat:${[String(a), String(b)].sort().join("_")}`,
    [],
  );

  const cleanupCallMedia = useCallback(
    (nextStatus: "idle" | "ended" | "failed" = "idle") => {
      clearRingTimeout();
      clearDisconnectTimeout();
      stopIncomingRingtone();
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      callAcceptedRef.current = false;
      hasRemoteDescriptionRef.current = false;
      pendingIceCandidatesRef.current = [];

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setCallStatus(nextStatus);
      setCallTimer(0);
      setCallPeerId("");
      setCallPeerName("");
      setIncomingCall(null);
      setIsMuted(false);
      setIsCameraOff(false);
      setIsSpeakerOn(true);
    },
    [clearRingTimeout, clearDisconnectTimeout, stopIncomingRingtone],
  );

  const addCallHistoryEntry = useCallback(
    async (entry: CallHistoryItem) => {
      setCallHistory((prev) => {
        if (prev.some((item) => item.id === entry.id)) return prev;

        const nearDuplicate = prev.some(
          (item) =>
            item.contactId === entry.contactId &&
            item.type === entry.type &&
            item.duration === entry.duration &&
            Math.abs(
              new Date(item.time).getTime() - new Date(entry.time).getTime(),
            ) < 8000,
        );

        if (nearDuplicate) return prev;

        return [entry, ...prev].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
      });
      // Log to backend for persistence
      try {
        let backendType = "";

        if (entry.type === "incoming") backendType = "call_incoming";
        else if (entry.type === "outgoing") backendType = "call_outgoing";
        else if (entry.type === "missed") backendType = "call_missed";
        // Always use the Contact._id for contactId if available
        let backendContactId = entry.contactId;

        if (contacts && contacts.length > 0) {
          const contact = contacts.find(
            (c) =>
              c._id === entry.contactId ||
              c.userId === entry.contactId ||
              c.linkedUserId === entry.contactId,
          );

          if (contact && contact._id) backendContactId = contact._id;
        }
        if (backendType && backendContactId) {
          await api.post("/interactions", {
            contactId: backendContactId,
            type: backendType,
            timestamp: entry.time,
            duration: entry.duration,
            notes: "",
            metadata: {},
          });
        }
      } catch (err) {
        // Ignore backend errors for now
      }
    },
    [contacts],
  );

  const loadCallHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/interactions/calls");

      setCallHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCallHistory([]);
    }
  }, [isAuthenticated]);

  const createPeerConnection = useCallback(
    (peerId: string) => {
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
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && peerId) {
          socketService.emit("iceCandidate", {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        console.log("[Call Debug] Received remote track", event.track.kind, stream?.id);

        if (stream) {
          remoteStreamRef.current = stream;
        }

        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.muted = !isSpeakerOn;
          remoteVideoRef.current.volume = isSpeakerOn ? 1 : 0;
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("[Call Debug] PeerConnection state:", state);

        if (state === "connected") {
          clearRingTimeout();
          clearDisconnectTimeout();
          setCallError("");
          setCallStatus("connected");
          callAcceptedRef.current = true;
          console.log("[Call Debug] PeerConnection connected");
          return;
        }

        if (state === "connecting") {
          clearDisconnectTimeout();
          console.log("[Call Debug] PeerConnection connecting");
          return;
        }

        if (state === "failed") {
          clearRingTimeout();
          clearDisconnectTimeout();
          setCallError("Call failed");
          cleanupCallMedia("failed");
          console.warn("[Call Debug] PeerConnection failed");
          return;
        }

        if (state === "disconnected") {
          clearRingTimeout();
          // Browsers can emit transient "disconnected" during ICE rechecks; wait before ending the call.
          if (callDisconnectTimeoutRef.current) return;
          setCallError("Reconnecting...");
          console.warn("[Call Debug] PeerConnection disconnected, waiting to see if it recovers");
          callDisconnectTimeoutRef.current = window.setTimeout(() => {
            const currentPc = peerConnectionRef.current;
            const currentState = currentPc?.connectionState;

            if (currentState === "connected" || currentState === "connecting") {
              clearDisconnectTimeout();
              return;
            }
            setCallError("Connection lost");
            cleanupCallMedia("failed");
            console.error("[Call Debug] PeerConnection lost connection after timeout");
          }, 8000);
          return;
        }

        if (state === "closed") {
          // No-op
        }
      };

      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;

        if (iceState === "connected" || iceState === "completed") {
          clearDisconnectTimeout();
          setCallError("");
        }
      };

      peerConnectionRef.current = pc;

      return pc;
    },
    [cleanupCallMedia, clearRingTimeout, clearDisconnectTimeout, isSpeakerOn],
  );

  const applyRemoteDescription = useCallback(
    async (description: RTCSessionDescriptionInit) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      // Prevent InvalidStateError: only set remote ANSWER if not already stable.
      // Remote OFFER starts from 'stable' state, so allow it!
      if (description.type === "answer" && pc.signalingState === "stable") {
        console.warn("[Call Debug] PeerConnection already stable, skipping setRemoteDescription for answer");
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        hasRemoteDescriptionRef.current = true;
      } catch (err) {
        console.error("[Call Debug] Failed to setRemoteDescription", err);
        return;
      }
      const queued = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Ignore malformed/transient ICE candidates.
        }
      }
    },
    [],
  );

  const startOutgoingCall = useCallback(
    async (peerId: string, mode: "audio" | "video", peerName?: string) => {
      if (!peerId || !user?._id) return;

      const contactMatch = contacts.find(
        (item) =>
          String(item?._id) === String(peerId) ||
          String(item?.userId || "") === String(peerId) ||
          String(item?.linkedUserId || "") === String(peerId),
      );
      const resolvedPeerId = String(
        contactMatch?.userId || contactMatch?.linkedUserId || peerId || "",
      );

      if (!resolvedPeerId) return;

      try {
        clearRingTimeout();
        setCallError("");
        setIncomingCall(null);
        setCallTimer(0);
        setCallStatus("calling");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser blocked media access. You must use localhost or HTTPS to use the camera/microphone.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection(resolvedPeerId);

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        socketService.emit("callUser", {
          to: resolvedPeerId,
          from: user._id,
          fromName: user.name,
          offer: { type: offer.type, sdp: offer.sdp }, // plain object – RTCSessionDescription doesn't JSON-serialize reliably
          type: mode,
        });

        setCallMode(mode);
        setCallPeerId(resolvedPeerId);
        setCallPeerName(
          peerName ||
            contactMatch?.name ||
            contacts.find((item) => item._id === resolvedPeerId)?.name ||
            "Unknown",
        );
        setCallDirection("outgoing");
        setCallStatus("ringing");

        callRingTimeoutRef.current = window.setTimeout(() => {
          if (callSnapshotRef.current.callStatus === "ringing") {
            setCallError("User not available");
            // Log missed call
            addCallHistoryEntry({
              id: `missed-${Date.now()}`,
              contactId: resolvedPeerId,
              name:
                peerName ||
                contactMatch?.name ||
                contacts.find((item) => item._id === resolvedPeerId)?.name ||
                "Unknown",
              type: "missed",
              time: new Date().toISOString(),
              duration: 0,
            });
            cleanupCallMedia("failed");
          }
        }, 20000);
      } catch (err: any) {
        if (mode === "video" && (err.name === "NotReadableError" || err.message?.includes("in use"))) {
          setAlert?.("Camera is busy (used by another tab). Falling back to Audio Call...", "warning");
          // Re-run as audio
          return startOutgoingCall(peerId, "audio", peerName);
        }
        console.error("[Call Debug] Error starting call:", err);
        setCallError("Call failed");
        setAlert?.("Unable to access microphone/camera: " + (err.message || ""), "danger");
        cleanupCallMedia("failed");
      }
    },
    [
      cleanupCallMedia,
      clearRingTimeout,
      createPeerConnection,
      setAlert,
      user?._id,
      user?.name,
      contacts,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall?.from) return;

    const remoteOffer = incomingCall.offer || incomingCall.signal;

    if (!remoteOffer?.type || !remoteOffer?.sdp) {
      setAlert?.("Invalid call payload. Please call again.", "warning");
      setIncomingCall(null);
      setCallStatus("failed");
      stopIncomingRingtone();

      return;
    }

    const mode = incomingCall.type === "video" ? "video" : "audio";

    try {
      clearRingTimeout();
      stopIncomingRingtone();
      setCallError("");
      setCallStatus("incoming");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser blocked media access. You must use localhost or HTTPS to use the camera/microphone.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(incomingCall.from);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await applyRemoteDescription(remoteOffer);
      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      const answerPayload: RTCSessionDescriptionInit = {
        type: answer.type,
        sdp: answer.sdp || "",
      };

      // Only emit one signal to the server (answerCall maps to onCallAnswered on the caller side)
      socketService.emit("answerCall", {
        to: incomingCall.from,
        answer: answerPayload,
      });

      setCallMode(mode);
      setCallPeerId(incomingCall.from);
      setCallPeerName(
        incomingCall.fromName ||
          contacts.find((item) => item._id === incomingCall.from)?.name ||
          "Unknown",
      );
      setCallDirection("incoming");
      setCallStatus("connected");
      setCallTimer(0);
      // Log incoming call as soon as connected
      addCallHistoryEntry({
        id: `incoming-${Date.now()}`,
        contactId: incomingCall.from,
        name:
          incomingCall.fromName ||
          contacts.find((item) => item._id === incomingCall.from)?.name ||
          "Unknown",
        type: "incoming",
        time: new Date().toISOString(),
        duration: 0,
      });
      setIncomingCall(null);
    } catch (err: any) {
      if (mode === "video" && (err.name === "NotReadableError" || err.message?.includes("in use"))) {
        setAlert?.("Camera is busy. Accepting as Audio Call...", "warning");
        // We can't easily recurse here without state changes, but we can retry getUserMedia for audio only
        try {
           const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
           localStreamRef.current = audioStream;
           // Continue with audio connection...
           const pc = createPeerConnection(incomingCall.from);
           audioStream.getTracks().forEach((track) => pc.addTrack(track, audioStream));
           await applyRemoteDescription(remoteOffer);
           const answer = await pc.createAnswer();
           await pc.setLocalDescription(answer);
           const answerPayload = { type: answer.type, sdp: answer.sdp || "" };
           socketService.emit("acceptCall", { to: incomingCall.from, signal: answerPayload });
           setCallMode("audio");
           setCallStatus("connected");
           setIncomingCall(null);
           return;
        } catch (audioErr) {
           console.error("[Call Debug] Audio fallback failed too", audioErr);
        }
      }
      console.error("[Call Debug] Error accepting call:", err);
      setCallError("Call failed");
      setAlert?.("Failed to accept call: " + (err.message || "Unknown error"), "danger");
      cleanupCallMedia("failed");
    }
  }, [
    applyRemoteDescription,
    cleanupCallMedia,
    clearRingTimeout,
    createPeerConnection,
    incomingCall,
    setAlert,
    contacts,
    stopIncomingRingtone,
  ]);

  const rejectIncomingCall = useCallback(() => {
    if (incomingCall?.from) {
      clearRingTimeout();
      stopIncomingRingtone();
      socketService.emit("reject-call", { to: incomingCall.from });
      addCallHistoryEntry({
        id: `local-missed-${Date.now()}`,
        contactId: incomingCall.from,
        name:
          incomingCall.fromName ||
          contacts.find((item) => item._id === incomingCall.from)?.name ||
          "Unknown",
        type: "missed",
        time: new Date().toISOString(),
        duration: 0,
      });
      window.setTimeout(() => {
        void loadCallHistory();
      }, 700);
    }
    setIncomingCall(null);
    setCallStatus("ended");
    setCallPeerId("");
    setCallPeerName("");
  }, [
    incomingCall,
    clearRingTimeout,
    addCallHistoryEntry,
    contacts,
    loadCallHistory,
    stopIncomingRingtone,
  ]);

  const endCurrentCall = useCallback(() => {
    clearRingTimeout();
    if (callPeerId) {
      socketService.emit("endCall", { to: callPeerId });
      addCallHistoryEntry({
        id: `local-end-${Date.now()}`,
        contactId: callPeerId,
        name:
          callPeerName ||
          contacts.find((item) => item._id === callPeerId)?.name ||
          "Unknown",
        type: callStatus === "connected" ? callDirection : "missed",
        time: new Date().toISOString(),
        duration: callStatus === "connected" ? callTimer : 0,
      });
      window.setTimeout(() => {
        void loadCallHistory();
      }, 700);
    }
    cleanupCallMedia("ended");
  }, [
    callPeerId,
    cleanupCallMedia,
    clearRingTimeout,
    addCallHistoryEntry,
    callDirection,
    callPeerName,
    callStatus,
    callTimer,
    contacts,
    loadCallHistory,
  ]);

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

  const pushNotification = useCallback(
    (payload: RealtimeNotification) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 50));
      setNotificationBadgeCount((prev) => prev + 1);
      setToasts((prev) => [payload, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((n) => n.id !== payload.id));
      }, 4000);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(payload.title, {
            body: payload.body || "New notification",
          });
        } catch {
          // Browser notification can fail in restricted contexts.
        }
      }

      try {
        const audio = new Audio("/notification.mp3");

        audio.volume = 0.25;
        void audio.play().catch(() => {
          playSystemTone(940, 0.14, 0.055);
        });
      } catch {
        playSystemTone(940, 0.14, 0.055);
      }
    },
    [playSystemTone],
  );

  const showToast = useCallback(
    (message: string, notification?: Partial<RealtimeNotification>) => {
      const item: RealtimeNotification = {
        id:
          notification?.id ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: (notification?.type as RealtimeNotification["type"]) || "message",
        title: notification?.title || "New Message",
        body: message,
        senderId: notification?.senderId,
        contactId: notification?.contactId,
        createdAt: notification?.createdAt || new Date().toISOString(),
      };

      pushNotification(item);
    },
    [pushNotification],
  );

  const handleRealtimeNotification = useCallback(
    (payload: Partial<RealtimeNotification>) => {
      if (!payload?.title && !payload?.body) return;
      const item: RealtimeNotification = {
        id:
          payload.id ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: (payload.type as RealtimeNotification["type"]) || "message",
        title: payload.title || "New Message",
        body: payload.body || "",
        senderId: payload.senderId,
        contactId: payload.contactId,
        createdAt: payload.createdAt || new Date().toISOString(),
      };

      showToast(item.body, item);
    },
    [showToast],
  );

  const handleNotificationClick = useCallback(
    (notification: RealtimeNotification) => {
      if (notification.type === "message") {
        setActiveView("chat");
        if (notification.contactId) {
          setActiveChatId(notification.contactId);
        }
      } else if (notification.type === "call") {
        setActiveView("calls");
      } else {
        setActiveView("reminder");
      }

      setShowNotificationPanel(false);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    },
    [],
  );

  const openChat = useCallback((contact: { id: string; name?: string }) => {
    if (!contact?.id) return;
    setActiveChatId(contact.id);
    setChatInput("");
  }, []);

  const toIdString = useCallback((value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const maybe = value as {
        _id?: unknown;
        id?: unknown;
        userId?: unknown;
        linkedUserId?: unknown;
      };

      if (maybe._id) return String(maybe._id);
      if (maybe.id) return String(maybe.id);
      if (maybe.userId) return String(maybe.userId);
      if (maybe.linkedUserId) return String(maybe.linkedUserId);
    }

    return String(value);
  }, []);

  const normalizeMessageForCurrentUser = useCallback(
    (message: ChatMessage): ChatMessage => {
      const selfId = String(user?._id || "");
      const senderId = toIdString(message.senderId);
      const receiverId = toIdString(message.receiverId);

      const perspectiveSender: ChatMessage["sender"] = senderId
        ? senderId === selfId
          ? "user"
          : "contact"
        : receiverId
          ? receiverId === selfId
            ? "contact"
            : "user"
          : message.sender === "contact"
            ? "contact"
            : "user";

      return {
        ...message,
        sender: perspectiveSender,
        senderId: senderId || message.senderId,
        receiverId: receiverId || message.receiverId,
      };
    },
    [toIdString, user?._id],
  );

  const shareableContacts = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();

    contacts.forEach((contact) => {
      const id =
        toIdString(contact?._id) ||
        toIdString(contact?.userId) ||
        toIdString(contact?.linkedUserId);

      if (!id) return;
      map.set(id, { _id: id, name: String(contact?.name || "Contact") });
    });

    chatSummaries.forEach((summary) => {
      const id = toIdString(summary?.userId);

      if (!id || map.has(id)) return;
      const name = String(summary?.name || "").trim();

      map.set(id, {
        _id: id,
        name: name && !/^unknown(\s+user)?$/i.test(name) ? name : "Chat User",
      });
    });

    if (currentContactId && !map.has(String(currentContactId))) {
      const summaryName =
        chatSummaries.find(
          (item) => String(item.userId) === String(currentContactId),
        )?.name || "";
      const fallbackName = String(summaryName).trim();

      map.set(String(currentContactId), {
        _id: String(currentContactId),
        name:
          fallbackName && !/^unknown(\s+user)?$/i.test(fallbackName)
            ? fallbackName
            : "Chat User",
      });
    }

    return Array.from(map.values());
  }, [contacts, chatSummaries, currentContactId, toIdString]);

  const openInlineShareSheet = useCallback(() => {
    if (!currentContactId) {
      setAlert?.("Open a chat first", "warning");

      return;
    }

    const fallback = shareableContacts[0]?._id || "";
    const storageKey = user?._id
      ? `last-share-contact:${user._id}`
      : "last-share-contact";
    const lastUsed = localStorage.getItem(storageKey) || "";
    const validLastUsed = shareableContacts.some(
      (contact) => String(contact?._id) === String(lastUsed),
    );

    setShareContactId(validLastUsed ? String(lastUsed) : String(fallback));
    setSharePreset("10m");
    setShareResult(null);
    setShowSharePopup(true);
  }, [currentContactId, setAlert, shareableContacts, user?._id]);

  const openChatFromContact = useCallback(
    (contact: QuickContact) => {
      const targetUserId = String(
        contact?.userId || contact?.linkedUserId || "",
      );

      if (!targetUserId) {
        setAlert?.("❌ This contact is not using the app", "warning");

        return;
      }
      setActiveView("chat");
      openChat({ id: targetUserId, name: contact.name });
    },
    [openChat, setAlert],
  );

  const startCallFromContact = useCallback(
    (contact: QuickContact, mode: "audio" | "video") => {
      const targetUserId = String(
        contact?.userId || contact?.linkedUserId || "",
      );

      if (!targetUserId) {
        setAlert?.("❌ This contact is not using the app", "warning");

        return;
      }
      void startOutgoingCall(targetUserId, mode, contact.name);
    },
    [setAlert, startOutgoingCall],
  );

  useEffect(() => {
    const viewParam = String(searchParams.get("view") || "").trim();
    const chatWith = String(searchParams.get("chatWith") || "").trim();
    const callMode = String(searchParams.get("call") || "").trim();
    const actionKey = `${viewParam}|${chatWith}|${callMode}`;

    if (!actionKey || actionKey === "||") return;
    if (deepLinkHandledRef.current === actionKey) return;

    if (viewParam === "chat") {
      setActiveView("chat");
    }
    if (chatWith) {
      setActiveChatId(chatWith);
    }

    if (chatWith && (callMode === "audio" || callMode === "video")) {
      const fromContacts = contacts.find(
        (item) =>
          String(item?._id) === chatWith ||
          String(item?.userId) === chatWith ||
          String(item?.linkedUserId) === chatWith,
      );

      void startOutgoingCall(
        chatWith,
        callMode,
        fromContacts?.name || "Unknown",
      );
    }

    deepLinkHandledRef.current = actionKey;
    router.replace("/");
  }, [searchParams, contacts, startOutgoingCall, router]);

  useEffect(() => {
    if (loadUser) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Sync local/remote stream with the DOM video elements whenever the UI re-renders and mounts the video elements.
  useEffect(() => {
    // Local stream sync
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    // Remote stream sync
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        console.log("[Call Debug] Synced remoteVideoRef with stream", remoteStreamRef.current.id);
      }
    }
  });

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

  const contactNameById = useMemo(() => {
    const map = new Map<string, string>();

    contacts.forEach((item) => {
      const name = item?.name || "Unknown User";

      if (item?._id) map.set(String(item._id), name);
      if (item?.userId) map.set(String(item.userId), name);
      if (item?.linkedUserId) map.set(String(item.linkedUserId), name);
    });

    return map;
  }, [contacts]);

  const getChatDisplayName = useCallback(
    (userId: string, summaryName?: string) => {
      const raw = (summaryName || "").trim();
      const isPlaceholder = !raw || /^unknown(\s+user)?$/i.test(raw);

      if (!isPlaceholder) return raw;

      const fromContacts = contactNameById.get(String(userId));

      return (fromContacts || raw || "Unknown User").trim();
    },
    [contactNameById],
  );

  const sortedChatThreads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...chatSummaries]
      .map((chat) => ({
        id: chat.userId,
        name: getChatDisplayName(chat.userId, chat.name),
        time: chat.updatedAt
          ? new Date(chat.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--",
        unread: unreadByContact[chat.userId] ?? chat.unreadCount ?? 0,
        lastMessage: chat.lastMessage || "No messages yet",
        updatedAtMs: chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0,
        isPinned: Boolean(chatMetaById[chat.userId]?.pinned),
        isArchived: Boolean(chatMetaById[chat.userId]?.archived),
      }))
      .filter((thread) => {
        if (thread.isArchived) return false;
        if (!query) return true;

        return (
          thread.name.toLowerCase().includes(query) ||
          thread.lastMessage.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }

        return b.updatedAtMs - a.updatedAtMs;
      });
  }, [
    chatSummaries,
    unreadByContact,
    search,
    chatMetaById,
    getChatDisplayName,
  ]);

  const currentContact =
    sortedChatThreads.find((thread) => thread.id === currentContactId) ||
    (currentContactId
      ? {
          id: currentContactId,
          name: getChatDisplayName(currentContactId, ""),
          time: "--:--",
          unread: 0,
          lastMessage: "",
          updatedAtMs: 0,
        }
      : null);

  useEffect(() => {
    const id = String(currentContactId || "").trim();

    if (!id) return;

    const currentName = String(currentContact?.name || "").trim();

    if (currentName && !/^unknown(\s+user)?$/i.test(currentName)) return;

    let cancelled = false;
    const resolveName = async () => {
      try {
        const res = await api.get(`/contacts/${id}`);
        const resolved = String(res?.data?.name || "").trim();

        // Only update if the name is different and valid
        if (!resolved || /^unknown(\s+user)?$/i.test(resolved) || cancelled)
          return;
        if (resolved !== currentName) {
          upsertSummary(id, { name: resolved });
        }
      } catch (err: any) {
        // If 404, do not update, just return
        if (err?.response?.status === 404) return;
        // Keep existing fallback name if lookup fails.
      }
    };

    void resolveName();

    return () => {
      cancelled = true;
    };
  }, [currentContactId, currentContact?.name, upsertSummary]);

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

      setChatMetaById(parsed && typeof parsed === "object" ? parsed : {});
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
      upcomingReminders:
        reminders.length + aiReminders.filter((r) => !r.isRead).length,
    }),
    [contacts.length, chatSummaries.length, reminders.length, aiReminders],
  );

  useEffect(() => {
    if (!activeChatId) return;
    const existsInThreads = sortedChatThreads.some(
      (thread) => thread.id === activeChatId,
    );
    const existsInContacts = contacts.some(
      (contact) => String(contact._id) === activeChatId,
    );
    const exists = existsInThreads || existsInContacts;

    if (!exists) {
      setActiveChatId("");
    }
  }, [sortedChatThreads, activeChatId, contacts]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadChatSummaries = async () => {
      try {
        const res = await api.get("/messages/summaries");
        const normalized = (Array.isArray(res.data) ? res.data : []).map(
          (summary: ChatSummary) => ({
            ...summary,
            name: getChatDisplayName(summary.userId, summary.name),
          }),
        );

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
    const token = localStorage.getItem("token");

    if (!token) return;

    socketService.connect(user._id, token);
    socketService.emit("join", user._id);
    socketService.emit("online", user._id);

    const onSocketConnected = () => {};

    const onSocketDisconnected = () => {};

    const onNewMessage = async (message: ChatMessage) => {
      try {
        console.log("[Socket] onNewMessage", message.clientMessageId);
        const normalizeId = (value: any) => {
          if (!value) return "";
          if (typeof value === "string") return value;
          if (typeof value === "object" && value._id) return String(value._id);

          return String(value);
        };

        const senderId = normalizeId(message.senderId);
        const receiverId = normalizeId(message.receiverId);
        const selfId = String(user?._id || "");

        // Always bucket conversation by the representative Contact ID.
        // We look up our contacts to see if this senderId (a User ID) corresponds to a contact we have.
        let bucketId = "";
        
        if (senderId && senderId !== selfId) {
          // It's an incoming message. Find which contact this user belongs to.
          const matchingContact = contactsRef.current.find(c => 
            String(c.linkedUserId) === senderId || String(c._id) === senderId
          );
          bucketId = matchingContact ? String(matchingContact._id) : senderId;
          console.log("[Socket] Resolved Incoming Bucket:", bucketId, matchingContact ? "(Found Contact)" : "(User ID Fallback)");
        } else if (receiverId && receiverId !== selfId) {
          // It's an outgoing message from another tab.
          const matchingContact = contactsRef.current.find(c => 
            String(c.linkedUserId) === receiverId || String(c._id) === receiverId
          );
          bucketId = matchingContact ? String(matchingContact._id) : receiverId;
          console.log("[Socket] Resolved Outgoing Bucket:", bucketId, matchingContact ? "(Found Contact)" : "(User ID Fallback)");
        }

        if (!bucketId) {
          // Fallback to whatever is in the message (ignore .to, not in ChatMessage type)
          bucketId = normalizeId(message.contactId);
        }

        if (!bucketId) return;

        let decryptedText = message.text;
        // E2EE: Decrypt if ciphertext, iv, and key are present
        if (message.message && message.iv && message.key) {
          try {
            const ciphertext = new Uint8Array(message.message);
            const iv = new Uint8Array(message.iv);
            const rawKey = new Uint8Array(message.key);
            const key = await importKey(rawKey);
            decryptedText = await decryptMessage(key, ciphertext, iv);
          } catch (err) {
            decryptedText = "[Unable to decrypt]";
          }
        }
        const normalizedMessage = normalizeMessageForCurrentUser({
          ...message,
          text: decryptedText,
          contactId: bucketId,
        });
        const normalizedSender: ChatMessage["sender"] = normalizedMessage.sender;

        setMessagesByContact((prev) => {
          const existing = prev[bucketId] || [];

          if (
            existing.some(
              (m) =>
                (m._id && m._id === message._id) ||
                (m.clientMessageId &&
                  m.clientMessageId === message.clientMessageId),
            )
          ) {
            return prev;
          }

          return { ...prev, [bucketId]: [...existing, normalizedMessage] };
        });

        const isIncoming = normalizedSender === "contact";
        const fallbackName = getChatDisplayName(String(bucketId), "");

        upsertSummary(bucketId, {
          name: fallbackName,
          lastMessage: decryptedText || "",
          updatedAt: message.createdAt || new Date().toISOString(),
        });

        if (isIncoming) {
          setUnreadByContact((prev) => ({
            ...prev,
            [bucketId]: (prev[bucketId] || 0) + 1,
          }));
          
          const senderName = fallbackName || "Someone";
          
          // Use REFs for live activeChatId and activeView to avoid stale closures
          const currentActiveChat = activeChatIdRef.current;
          const currentView = activeViewRef.current;
          console.log("[Socket] isIncoming. ActiveChat:", currentActiveChat, "View:", currentView, "Bucket:", bucketId);

          // The GlobalSocketListener now handles all Pop-ups (Toasts)
          // We only need to update the notification list for the bell icon badge here
          setNotifications?.((prev: any) => [{
            id: `msg-${Date.now()}`,
            type: "message",
            title: `New message from ${senderName}`,
            body: decryptedText || "Sent a message",
            senderId: bucketId,
            createdAt: new Date().toISOString()
          }, ...(prev || [])]);
          setNotificationBadgeCount((prev) => prev + 1);

          // Mark as seen immediately if we ARE looking at it
          if (currentView === "chat" && currentActiveChat === bucketId) {
            socketService.emit("mark-seen", { contactId: bucketId });
          }
        }
      } catch (err: any) {
        console.error("[Socket Error] onNewMessage failed:", err.message);
      }
    };

    const onIncomingCall = (payload: IncomingCallPayload) => {
      const resolvedOffer = payload?.offer || payload?.signal;

      if (!resolvedOffer?.type || !resolvedOffer?.sdp) {
        console.warn('[Socket] incomingCall dropped – missing offer.type or offer.sdp', payload);
        return;
      }

      const dedupeKey = `${String(payload?.from || "")}:${String(payload?.type || "audio")}`;
      const now = Date.now();

      if (
        lastIncomingCallRef.current.key === dedupeKey &&
        now - lastIncomingCallRef.current.at < 1200
      ) {
        return;
      }
      lastIncomingCallRef.current = { key: dedupeKey, at: now };

      clearRingTimeout();
      setCallError("");
      setIncomingCall({ ...payload, offer: resolvedOffer });
      setCallMode(payload.type === "video" ? "video" : "audio");
      setCallPeerId(payload.from || "");
      setCallPeerName(
        payload.fromName ||
          contactNameById.get(String(payload.from)) ||
          "Unknown",
      );
      setCallStatus("incoming");
      startIncomingRingtone();
      setAlert?.(
        `Incoming call from ${payload.fromName || contactNameById.get(String(payload.from)) || "Unknown"}`,
        "warning",
      );
    };

    const onReminderDue = (payload: { message: string }) => {
      setAlert?.(`Reminder: ${payload.message}`, "secondary");
    };

    const onAIReminderDue = (payload: AIReminder) => {
      setAiReminders((prev) => [payload, ...prev]);
      setAlert?.(
        `AI Reminder: ${payload.message}`,
        payload.priority === "high" ? "warning" : "primary",
      );
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

    const onMessageDelivered = (payload: {
      messageId?: string;
      contactId?: string;
      receiverId?: string;
    }) => {
      const contactId = payload?.contactId || payload?.receiverId || "";

      if (!contactId) return;
      setMessagesByContact((prev) => {
        const list = prev[contactId] || [];
        const next: ChatMessage[] = list.map((m) => {
          if (payload.messageId && m._id === payload.messageId) {
            return {
              ...m,
              status: "delivered" as const,
              deliveredAt: new Date().toISOString(),
            };
          }
          if (!payload.messageId && m.sender === "user") {
            return {
              ...m,
              status: (m.status === "seen" ? "seen" : "delivered") as
                | "seen"
                | "delivered",
            };
          }

          return m;
        });

        return { ...prev, [contactId]: next };
      });
    };

    const onMessageSeen = (payload: { contactId?: string }) => {
      if (!payload?.contactId) return;
      setMessagesByContact((prev) => {
        const list = prev[payload.contactId || ""] || [];
        const next: ChatMessage[] = list.map((m) =>
          m.sender === "user"
            ? {
                ...m,
                status: "seen" as const,
                seenAt: new Date().toISOString(),
              }
            : m,
        );

        return { ...prev, [payload.contactId || ""]: next };
      });
    };

    const onCallAnswered = async (payload: {
      answer?: RTCSessionDescriptionInit;
      signal?: RTCSessionDescriptionInit;
    }) => {
      try {
        const remoteAnswer = payload?.answer || payload?.signal;
        console.log("[Call Debug] onCallAnswered payload:", payload);
        if (!peerConnectionRef.current) {
          console.warn("[Call Debug] No peerConnectionRef");
          return;
        }
        if (!remoteAnswer?.type || !remoteAnswer?.sdp) {
          console.warn("[Call Debug] Invalid remoteAnswer", remoteAnswer);
          return;
        }
        if (callAcceptedRef.current || peerConnectionRef.current.signalingState === "stable") {
          console.log("[Call Debug] Call already accepted or stable, ignoring redundant answer");
          return;
        }

        console.log("[Call Debug] Applying remote answer", remoteAnswer);
        await applyRemoteDescription(remoteAnswer);
        // Mark remote description as set for ICE
        hasRemoteDescriptionRef.current = true;
        // Apply any pending ICE candidates
        if (pendingIceCandidatesRef.current.length > 0) {
          console.log("[Call Debug] Applying pending ICE candidates after remote description", pendingIceCandidatesRef.current.length);
          for (const candidate of pendingIceCandidatesRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("[Call Debug] Failed to add pending ICE candidate", err);
            }
          }
          pendingIceCandidatesRef.current = [];
        }
        callAcceptedRef.current = true;
        clearRingTimeout();
        setIncomingCall(null);
        setCallError("");
        setCallStatus("connected");
        setCallTimer(0);
        // If this is an outgoing call, log it
        if (callDirection === "outgoing" && callPeerId && callPeerName) {
          addCallHistoryEntry({
            id: `outgoing-${Date.now()}`,
            contactId: callPeerId,
            name: callPeerName,
            type: "outgoing",
            time: new Date().toISOString(),
            duration: 0,
          });
        }
        console.log("[Call Debug] Call accepted and connection should be established");
      } catch (err: any) {
        console.error("[Call Debug] Failed to apply remote answer", err);
        setCallError("Call failed");
        setAlert?.("Failed to establish call: " + (err.message || "Unknown error"), "danger");
      }
    };

    const onIceCandidate = async (payload: {
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        if (!peerConnectionRef.current || !payload?.candidate) return;
        if (!hasRemoteDescriptionRef.current) {
          console.log("[Call Debug] ICE candidate received before remote description, queueing");
          pendingIceCandidatesRef.current.push(payload.candidate);
          return;
        }
        console.log("[Call Debug] Adding ICE candidate", payload.candidate);
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(payload.candidate),
        );
      } catch (err) {
        console.warn("[Call Debug] Failed to add ICE candidate", err);
      }
    };

    const onCallRejected = () => {
      clearRingTimeout();
      setCallError("User not available");
      cleanupCallMedia("failed");
    };

    const onUserOffline = () => {
      clearRingTimeout();
      setCallError("User not available");
      cleanupCallMedia("failed");
    };

    const onCallEnded = () => {
      clearRingTimeout();
      const snapshot = callSnapshotRef.current;

      if (snapshot.callPeerId) {
        addCallHistoryEntry({
          id: `local-ended-${Date.now()}`,
          contactId: snapshot.callPeerId,
          name:
            snapshot.callPeerName ||
            contactNameById.get(String(snapshot.callPeerId)) ||
            "Unknown",
          type:
            snapshot.callStatus === "connected"
              ? snapshot.callDirection
              : "missed",
          time: new Date().toISOString(),
          duration:
            snapshot.callStatus === "connected" ? snapshot.callTimer : 0,
        });
        window.setTimeout(() => {
          void loadCallHistory();
        }, 700);
      }
      cleanupCallMedia("ended");
    };

    const onShareUpdated = (payload: ShareUpdatedPayload) => {
      if (!payload?.token) return;

      setShareActionByToken((prev) => {
        const current = prev[payload.token] || "idle";

        if (payload.status === "expired" || payload.isActive === false) {
          return { ...prev, [payload.token]: "expired" };
        }
        if (current === "used" || current === "invalid") {
          return prev;
        }

        return { ...prev, [payload.token]: "idle" };
      });

      if (
        !payload.expiresAt &&
        payload.isActive !== false &&
        payload.status !== "expired"
      ) {
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
            const nextExpiry =
              payload.status === "expired" || payload.isActive === false
                ? new Date(Date.now() - 1000).toISOString()
                : payload.expiresAt ||
                  message.shareExpiresAt ||
                  message.sharePayload?.expiresAt ||
                  null;

            return {
              ...message,
              shareExpiresAt: nextExpiry,
              sharePayload: message.sharePayload
                ? {
                    ...message.sharePayload,
                    expiresAt: nextExpiry || message.sharePayload.expiresAt,
                  }
                : message.sharePayload,
            };
          });

          updated[contactId] = nextMessages;
        });

        return changed ? updated : prev;
      });
    };

    socketService.on("connect", onSocketConnected);
    socketService.on("disconnect", onSocketDisconnected);

    socketService.on("newMessage", onNewMessage);
    socketService.on("receiveMessage", onNewMessage);
    socketService.on("incomingCall", onIncomingCall);
    socketService.on("reminder-due", onReminderDue);
    socketService.on("ai-reminder-due", onAIReminderDue);
    socketService.on("typing-start", onTypingStart);
    socketService.on("typing", onTypingAlias);
    socketService.on("typing-stop", onTypingStop);
    socketService.on("stopTyping", onStopTypingAlias);
    socketService.on("online-users", onOnlineUsers);
    socketService.on("message-delivered", onMessageDelivered);
    socketService.on("message-seen", onMessageSeen);
    socketService.on("callAnswered", (payload) => { console.log('[Socket] callAnswered', payload); void onCallAnswered(payload); });
    socketService.on("call-accepted", (payload) => { console.log('[Socket] call-accepted', payload); void onCallAnswered(payload); }); // server alias
    socketService.on("callAccepted", (payload) => { console.log('[Socket] callAccepted', payload); void onCallAnswered(payload); }); // server alias
    socketService.on("iceCandidate", (payload) => { console.log('[Socket] iceCandidate', payload); onIceCandidate(payload); });
    socketService.on("ice-candidate", (payload) => { console.log('[Socket] ice-candidate', payload); onIceCandidate(payload); }); // server alias
    socketService.on("callRejected", () => { console.log('[Socket] callRejected'); onCallRejected(); });
    socketService.on("call-rejected", () => { console.log('[Socket] call-rejected'); onCallRejected(); }); // server alias
    socketService.on("callEnded", () => { console.log('[Socket] callEnded'); cleanupCallMedia("ended"); });
    socketService.on("call-ended", () => { console.log('[Socket] call-ended'); cleanupCallMedia("ended"); }); // server alias
    socketService.on("user-offline", onUserOffline);
    socketService.on("shareUpdated", onShareUpdated);

    return () => {
      socketService.off("connect", onSocketConnected);
      socketService.off("disconnect", onSocketDisconnected);
      socketService.off("newMessage", onNewMessage);
      socketService.off("receiveMessage", onNewMessage);
      socketService.off("incomingCall", onIncomingCall);
      socketService.off("reminder-due", onReminderDue);
      socketService.off("ai-reminder-due", onAIReminderDue);
      socketService.off("typing-start", onTypingStart);
      socketService.off("typing", onTypingAlias);
      socketService.off("typing-stop", onTypingStop);
      socketService.off("stopTyping", onStopTypingAlias);
      socketService.off("online-users", onOnlineUsers);
      socketService.off("message-delivered", onMessageDelivered);
      socketService.off("message-seen", onMessageSeen);
      socketService.off("callAnswered", onCallAnswered);
      socketService.off("call-accepted", onCallAnswered);
      socketService.off("callAccepted", onCallAnswered);
      socketService.off("iceCandidate", onIceCandidate);
      socketService.off("ice-candidate", onIceCandidate);
      socketService.off("callRejected", onCallRejected);
      socketService.off("call-rejected", onCallRejected);
      socketService.off("callEnded", cleanupCallMedia);
      socketService.off("call-ended", cleanupCallMedia);
      socketService.off("user-offline", onUserOffline);
      socketService.off("shareUpdated", onShareUpdated);
    };
  }, [
    applyRemoteDescription,
    cleanupCallMedia,
    clearRingTimeout,
    setAlert,
    user?._id,
    isAuthenticated,
    upsertSummary,
    addCallHistoryEntry,
    loadCallHistory,
    contactNameById,
    normalizeMessageForCurrentUser,
  ]);

  // Patch: Sync with server time on mount and after share creation
  useEffect(() => {
    if (!user?._id || !isAuthenticated) return;

    const onNotification = (payload: Partial<RealtimeNotification>) => {
      if (payload?.senderId && String(payload.senderId) === String(user._id)) {
        return;
      }
      handleRealtimeNotification(payload);
    };

    socketService.off("notification");
    socketService.on("notification", onNotification);

    // Initial sync with server time (optional: fetch from /api/time or use dashboard/serverTime)
    api.get("/share/mine").then(res => {
      if (res?.data?.serverTime) syncWithServer(res.data.serverTime);
    });

    return () => {
      socketService.off("notification", onNotification);
    };
  }, [handleRealtimeNotification, isAuthenticated, user?._id, syncWithServer]);

  useEffect(() => {
    if (isAuthenticated) return;
    socketService.disconnect();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!currentContactId) return;
    socketService.emit("join-chat", { contactId: currentContactId });
    if (user?._id) {
      socketService.emit(
        "joinRoom",
        buildChatRoomId(user._id, currentContactId),
      );
    }
    socketService.emit("mark-seen", { contactId: currentContactId });
    setUnreadByContact((prev) => ({ ...prev, [currentContactId]: 0 }));
    setChatSummaries((prev) =>
      prev.map((item) =>
        item.userId === currentContactId ? { ...item, unreadCount: 0 } : item,
      ),
    );

    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/messages/thread/${currentContactId}?limit=80`,
        );
        const normalized = (Array.isArray(res.data) ? res.data : []).map(
          (item: ChatMessage) =>
            normalizeMessageForCurrentUser({
              ...item,
              contactId: currentContactId,
            }),
        );

        setMessagesByContact((prev) => ({
          ...prev,
          [currentContactId]: normalized,
        }));
      } catch {
        try {
          const fallback = await api.get(
            `/messages/${currentContactId}?limit=80`,
          );
          const normalizedFallback = (
            Array.isArray(fallback.data) ? fallback.data : []
          ).map((item: ChatMessage) =>
            normalizeMessageForCurrentUser({
              ...item,
              contactId: currentContactId,
            }),
          );

          setMessagesByContact((prev) => ({
            ...prev,
            [currentContactId]: normalizedFallback,
          }));
        } catch {
          setAlert?.("Unable to load chat messages", "danger");
        }
      }
    };

    fetchMessages();
  }, [
    buildChatRoomId,
    currentContactId,
    setAlert,
    user?._id,
    normalizeMessageForCurrentUser,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboard = async () => {
      try {
        const res = await api.get("/dashboard");

        setDashboardInsights(res.data || null);
      } catch {
        setDashboardInsights(null);
      }
    };

    const loadAiReminders = async () => {
      try {
        const res = await api.get("/ai-reminders");

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
        const res = await api.get("/reminders");

        setReminders(res.data || []);
      } catch {
        setAlert?.("Unable to load reminders", "danger");
      }
    };

    loadReminders();
  }, [isAuthenticated, setAlert]);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const intervalId = window.setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [callStatus]);

  useEffect(() => {
    if (callStatus !== "ended" && callStatus !== "failed") return;
    const timeoutId = window.setTimeout(() => {
      setCallError("");
      cleanupCallMedia("idle");
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [callStatus, cleanupCallMedia]);

  useEffect(
    () => () => {
      if (typingStopTimer.current) {
        window.clearTimeout(typingStopTimer.current);
      }
      cleanupCallMedia();
    },
    [cleanupCallMedia],
  );

  useEffect(() => {
    if (!currentContactId) return;
    const box = chatScrollRef.current;

    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [currentContactId, messagesByContact, typingByContact]);

  const widgetCard = (title: string, value: string, icon: string) => (
    <PremiumWidget icon={icon} title={title} value={value} />
  );

  const renderDashboard = () => (
    <main className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="glass-panel-strong">
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome back, {user?.name || "User"}!
                </h1>
                <p className="text-sm text-gray-500">
                  Premium workspace overview with secure activity highlights.
                </p>
              </div>
              <Button
                className="neon-action"
                onPress={() => setActiveView("secure-links")}
              >
                <i className="fas fa-link mr-2" /> Generate Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                icon: "fas fa-user-plus",
                title: "Add Contact",
                desc: "Create and enrich your network instantly.",
                view: "contacts",
              },
              {
                icon: "fas fa-comments",
                title: "Start Chat",
                desc: "Open real-time conversations in one tap.",
                view: "chat",
              },
              {
                icon: "fas fa-link",
                title: "Share Link",
                desc: "Generate secure, expiring access links.",
                view: "secure-links",
              },
              {
                icon: "fas fa-shield-halved",
                title: "Secure Vault",
                desc: "Protect and access sensitive records safely.",
                view: "vault",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="glass-card cursor-pointer"
                onClick={() => setActiveView(card.view as ViewKey)}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-500">
                  Quick Action
                </p>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                  <i className={card.icon} />
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel-strong flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Contacts
              </h2>
              <StatusBadge
                label={`Total ${dashboardStats.totalContacts || 0}`}
              />
            </div>
            <div className="flex flex-col gap-4">
              {normalizedContacts.slice(0, 5).map((contact) => (
                <div
                  key={String(contact._id || contact.phone || contact.name)}
                  className="glass-card !p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4 min-w-0">
                      <AppAvatar
                        className="!w-10 !h-10"
                        name={contact.name || "U"}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {contact.phone || "No phone number"}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="text-indigo-600 font-semibold"
                      size="sm"
                      variant="flat"
                      onPress={() => setEditContactId(contact._id ?? null)}
                    >
                      Edit
                    </Button>
                  </div>
                  {editContactId === contact._id && (
                    <form
                      className="flex flex-col gap-2 mt-2 bg-indigo-50/60 rounded-xl p-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await api.put(`/contacts/${contact._id}`, {
                            name: editContactName,
                            email: editContactEmail,
                            phone: editContactPhone,
                          });
                          setAlert?.("Contact updated!", "success");
                          setEditContactId(null);
                          // Optionally reload contacts
                          contactContext?.getContacts?.();
                        } catch {
                          setAlert?.("Failed to update contact", "danger");
                        }
                      }}
                    >
                      <input
                        required
                        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        placeholder="Name"
                        type="text"
                        value={editContactName}
                        onChange={(e) => setEditContactName(e.target.value)}
                      />
                      <input
                        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        placeholder="Email"
                        type="email"
                        value={editContactEmail}
                        onChange={(e) => setEditContactEmail(e.target.value)}
                      />
                      <input
                        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        placeholder="Phone number"
                        type="tel"
                        value={editContactPhone}
                        onChange={(e) => setEditContactPhone(e.target.value)}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          className="bg-indigo-600 text-white"
                          size="sm"
                          type="submit"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="flat"
                          onPress={() => setEditContactId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
              {normalizedContacts.length === 0 && (
                <p className="text-sm text-gray-500">No recent contacts yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="glass-panel-strong flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700">
                Smart Suggestions
              </h3>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-xl">
                LIVE
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Smart suggestions to reconnect, follow-up, and keep your contact
              graph clean.
            </p>
            <div className="glass-card !p-4 border border-white/40">
              <p className="text-sm text-gray-700">
                You haven&apos;t contacted John in 7 days
              </p>
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
                Priority: Medium
              </p>
            </div>
            <Button className="neon-action w-full">
              <i className="fas fa-sparkles mr-2" /> Ask AI
            </Button>
          </div>
        </div>
      </div>
    </main>
  );

  const renderContacts = () => (
    <main className="w-full">
      <div className="flex flex-col gap-6 fade-in animate-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl" />
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Contact Tools
            </h3>
            <p className="text-[13px] text-slate-500 mt-1">
              Quickly generate secure, expiring links for contact sharing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link className="shrink-0" href="/share">
              <Button
                className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                variant="flat"
              >
                <i className="fas fa-chart-line mr-2" />
                My Shared Links
              </Button>
            </Link>
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
              onPress={() => openShareGenerator()}
            >
              <i className="fas fa-share-nodes mr-2" />
              Smart Share Generator
            </Button>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500 rounded-l-2xl" />
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Contacts
              </h3>
              <p className="text-[13px] text-slate-500 mt-1">
                Manage your contact list quickly and cleanly.
              </p>
            </div>
            <Button
              className="bg-indigo-600 text-white font-medium shadow-md hover:bg-indigo-700 transition-all px-6"
              onPress={() => setShowAddContact(true)}
            >
              + Add Contact
            </Button>
          </div>

          <div className="mb-6">
            <ContactFilter />
          </div>

          <Contacts
            onOpenChat={openChatFromContact}
            onVideoCall={(contact) => startCallFromContact(contact, "video")}
            onVoiceCall={(contact) => startCallFromContact(contact, "audio")}
          />
        </div>

        {showAddContact && (
          <>
            <div
              aria-modal="true"
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
              role="dialog"
              style={{ overscrollBehavior: "contain" }}
            >
              <div
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #e0fff7 0%, #e6e6ff 60%, #ffe6fa 100%)",
                }}
              >
                <ContactForm
                  onCancel={() => setShowAddContact(false)}
                  onSaved={() => setShowAddContact(false)}
                />
              </div>
            </div>
            <style>{`body { overflow: hidden !important; }`}</style>
          </>
        )}
      </div>
    </main>
  );

  const renderChats = () => (
    <main className="p-6">
      <div className="fade-in min-h-[560px] w-full px-0 justify-start items-start">
        {!activeChatId && (
          <div className="glass-panel p-3">
            <h3 className="text-lg font-semibold neon-title px-2 py-2">
              Chat List
            </h3>
            <div className="flex flex-col gap-6">
              {sortedChatThreads.length === 0 && (
                <p className="text-sm app-muted p-2">
                  No chats yet. Start a conversation from Contacts.
                </p>
              )}
              {sortedChatThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                  role="button"
                  tabIndex={0}
                  onClick={() => openChat({ id: thread.id, name: thread.name })}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    openChat({ id: thread.id, name: thread.name });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar-orb !w-10 !h-10">
                        {(thread.name?.charAt(0) || "U").toUpperCase()}
                      </div>
                      <p className="font-semibold truncate">{thread.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {thread.isPinned && (
                        <i className="fas fa-thumbtack text-amber-300 text-xs" />
                      )}
                      <span className="text-xs app-muted">{thread.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm app-muted truncate">
                      {thread.lastMessage}
                    </p>
                    <div className="flex items-center gap-2">
                      {thread.unread > 0 && (
                        <span className="badge-pill">{thread.unread}</span>
                      )}
                      <button
                        aria-label={thread.isPinned ? "Unpin chat" : "Pin chat"}
                        className="glass-action !min-w-7 !w-7 !h-7 rounded-2xl"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleChatPin(thread.id);
                        }}
                      >
                        <i
                          className={`fas ${thread.isPinned ? "fa-thumbtack" : "fa-thumbtack"} text-[10px]`}
                        />
                      </button>
                      <button
                        aria-label={
                          thread.isArchived ? "Unarchive chat" : "Archive chat"
                        }
                        className="glass-action !min-w-7 !w-7 !h-7 rounded-2xl"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleChatArchive(thread.id);
                        }}
                      >
                        <i
                          className={`fas ${thread.isArchived ? "fa-box-open" : "fa-box-archive"} text-[10px]`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChatId && (
          <div className="fixed inset-0 z-[85] p-0 sm:p-3 md:p-4">
            <div className="full-chat-shell h-full p-4 sm:p-5 flex flex-col relative">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="glass-action px-3 py-2 rounded-2xl text-sm min-w-[80px]"
                  type="button"
                  onClick={() => {
                    setActiveChatId("");
                  }}
                >
                  <i className="fas fa-arrow-left" />
                  Back
                </button>
                <h3 className="text-lg font-semibold neon-title truncate">
                  {currentContact?.name || "Chat Window"}
                </h3>
                <div className="flex items-center gap-2 min-w-[96px] justify-end">
                  <Button
                    isIconOnly
                    aria-label="Voice call"
                    className="glass-action !min-w-9 !w-9 !h-9"
                    onPress={() => {
                      if (!currentContactId) return;
                      void startOutgoingCall(
                        currentContactId,
                        "audio",
                        currentContact?.name || "Unknown",
                      );
                    }}
                  >
                    <i className="fas fa-phone" />
                  </Button>
                  <Button
                    isIconOnly
                    aria-label="Video call"
                    className="glass-action !min-w-9 !w-9 !h-9"
                    onPress={() => {
                      if (!currentContactId) return;
                      void startOutgoingCall(
                        currentContactId,
                        "video",
                        currentContact?.name || "Unknown",
                      );
                    }}
                  >
                    <i className="fas fa-video" />
                  </Button>
                </div>
              </div>
              <p className="text-xs app-muted">
                {currentContactId && onlineUsers.includes(currentContactId)
                  ? "Online now"
                  : "Offline"}
              </p>
              <div ref={chatScrollRef} className="chat-window flex-1 min-h-0">
                {/* Force re-render on currentTime change by including it as a key */}
                {(
                  (messagesByContact[currentContactId] || []) as ChatMessage[]
                ).map((message, idx) => {
                  const isMe =
                    toIdString(message.senderId) === String(user?._id || "") ||
                    (!message.senderId && message.sender === "user");

                  return (
                    <div
                      key={`${message._id || message.clientMessageId || idx}-${currentTime.getTime()}`}
                      className={`message-row ${isMe ? "is-me" : "is-them"}`}
                    >
                      <div className="message-bubble min-w-[120px] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]">
                        {message.messageType === "contact_share" ? (
                          <div className="flex flex-col gap-2">
                            {isMe ? (
                              <>
                                <div className="flex items-center gap-2 border-b border-blue-400/30 pb-2 mb-1">
                                  <i className="fas fa-address-book text-blue-200" />
                                  <p className="font-semibold text-[13px] text-white tracking-wide uppercase">
                                    Shared Contact
                                  </p>
                                </div>
                                <p className="text-[15px] font-bold text-white truncate">
                                  <i className="fas fa-user mr-1 text-blue-200" />{" "}
                                  {message.sharedContactName || "Contact"}
                                </p>
                                <p className="text-[11px] text-blue-200 flex items-center gap-1 mt-1">
                                  <i className="fas fa-clock" /> Expires: {" "}
                                  {(() => {
                                    let expiryRaw = message.sharePayload?.expiresAt || message.shareExpiresAt || null;
                                    // Fallback: if missing, use createdAt + 5min if message is recent and type is contact_share
                                    if (!expiryRaw && message.messageType === "contact_share" && message.createdAt) {
                                      const created = new Date(message.createdAt);
                                      if (!isNaN(created.getTime())) {
                                        const fallbackExpiry = new Date(created.getTime() + 5 * 60 * 1000).toISOString();
                                        expiryRaw = fallbackExpiry;
                                      }
                                    }
                                    console.log('[DEBUG] ChatMessage expiryRaw:', expiryRaw, 'message:', message);
                                    return formatShareExpiry(expiryRaw);
                                  })()}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                                  <i className="fas fa-shield-halved text-indigo-500" />
                                  <p className="font-semibold text-[13px] text-slate-800 tracking-wide uppercase">
                                    Contact Access
                                  </p>
                                </div>
                                {(() => {
                                  const token = getShareToken(message);
                                  const state = shareActionByToken[token] || "idle";
                                  let expiresAt = getShareExpiresAt(message);
                                  let isExpired = false;
                                  let expiryText = "Unknown";
                                  // Robust fallback: if expiresAt is missing or invalid, use createdAt + 5min
                                  if ((!expiresAt || isNaN(expiresAt.getTime())) && message.messageType === "contact_share" && message.createdAt) {
                                    const created = new Date(message.createdAt);
                                    if (!isNaN(created.getTime())) {
                                      expiresAt = new Date(created.getTime() + 5 * 60 * 1000);
                                    }
                                  }
                                  if (typeof window !== 'undefined') {
                                    // eslint-disable-next-line no-console
                                    console.log('[DEBUG][CHAT ACCESS][RECEIVER] NOW:', new Date().toISOString(), 'currentTime:', currentTime.toISOString(), 'EXPIRES_AT:', expiresAt ? expiresAt.toISOString() : null, 'message:', message);
                                  }
                                  if (expiresAt && !isNaN(expiresAt.getTime())) {
                                    expiryText = formatShareExpiry(expiresAt.toISOString());
                                    isExpired = expiresAt.getTime() <= currentTime.getTime();
                                  } else {
                                    expiryText = "Expired";
                                    isExpired = true;
                                  }
                                  if (state === "expired") isExpired = true;
                                  const isUsed = state === "used";
                                  const disabled =
                                    state === "loading" ||
                                    isExpired ||
                                    isUsed ||
                                    state === "invalid";

                                  if (isExpired) {
                                    return (
                                      <p className="text-[13px] text-rose-500 font-medium py-1 flex items-center gap-1">
                                        <i className="fas fa-circle-xmark" />{" "}
                                        Access Expired
                                      </p>
                                    );
                                  } else if (isUsed) {
                                    return (
                                      <p className="text-[13px] text-amber-500 font-medium py-1 flex items-center gap-1">
                                        <i className="fas fa-circle-exclamation" />{" "}
                                        One-time access used
                                      </p>
                                    );
                                  } else {
                                    return (
                                      <div className="flex flex-col gap-1.5 w-full">
                                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                                          <i className="fas fa-clock text-indigo-400" />
                                          Expires in: {" "}
                                          <span
                                            className={
                                              expiryText === "Expired"
                                                ? "text-rose-500"
                                                : "text-slate-700"
                                            }
                                          >
                                            {expiryText}
                                          </span>
                                        </p>
                                        <div className="flex items-center gap-2 pt-1 pb-1">
                                          <button
                                            className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2 px-3 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                            disabled={disabled}
                                            type="button"
                                            onClick={() => {
                                              void consumeSharedContactAction(
                                                message,
                                                "call",
                                              );
                                            }}
                                          >
                                            {state === "loading" ? (
                                              <><i className="fas fa-spinner fa-spin text-green-600" /> Connecting...</>
                                            ) : (
                                              <><i className="fas fa-phone text-green-600" /> Call Now</>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                })()}
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                  <i className="fas fa-lock" /> End-to-end
                                  encrypted
                                </p>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <p className="leading-relaxed">{message.text}</p>
                            {message.isTemporary && message.expiresAt && (
                              <p
                                className={`text-[10px] flex items-center gap-1 mt-1 ${isMe ? "text-blue-200" : "text-amber-500"}`}
                              >
                                <i className="fas fa-fire-flame-curved" />
                                Burn after{" "}
                                {new Date(message.expiresAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            )}
                          </div>
                        )}
                        <div
                          className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isMe ? "text-blue-100" : "text-slate-400"}`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && (
                            <span className="ml-0.5">
                              {message.status === "seen" ? (
                                <i className="fas fa-check-double text-blue-200" />
                              ) : message.status === "delivered" ? (
                                <i className="fas fa-check-double" />
                              ) : (
                                <i className="fas fa-check" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingByContact[currentContactId] && (
                  <div className="message-row is-them">
                    <div className="message-bubble min-w-[70px] flex items-center justify-center py-3">
                      <div className="flex gap-1">
                        <div
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {showSharePopup && (
                <div className="inline-share-panel absolute left-1/2 -translate-x-1/2 bottom-[84px] z-20 w-[min(92%,420px)] rounded-2xl p-3 fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold neon-title">
                      Quick Share
                    </h4>
                    <button
                      className="glass-action px-2 py-1 rounded-2xl text-[11px]"
                      type="button"
                      onClick={() => {
                        setShowSharePopup(false);
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-3">
                    <div>
                      <p className="text-[11px] app-muted mb-1">Contact</p>
                      <div className="glass-action rounded-xl p-2 max-h-24 overflow-y-auto">
                        {shareableContacts.length === 0 ? (
                          <p className="px-1 py-1 text-[11px] text-rose-500">
                            No contacts available to share.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {shareableContacts.slice(0, 24).map((contact) => {
                              const isSelected =
                                String(shareContactId) === String(contact._id);

                              return (
                                <button
                                  key={contact._id}
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] border transition-all ${isSelected ? "border-cyan-300 bg-cyan-500/20 text-indigo-600 font-semibold" : "border-cyan-300/25 text-gray-600 hover:bg-cyan-500/10"}`}
                                  type="button"
                                  onClick={() =>
                                    setShareContactId(String(contact._id))
                                  }
                                >
                                  {contact.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] app-muted mb-1">Expires in</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: "5m", label: "5m" },
                            { id: "10m", label: "10m" },
                            { id: "1h", label: "1h" },
                          ] as Array<{ id: SharePreset; label: string }>
                        ).map((item) => {
                          const selected = sharePreset === item.id;

                          return (
                            <button
                              key={item.id}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] border transition-all ${selected ? "border-cyan-300 bg-cyan-500/20 text-indigo-500" : "border-cyan-300/25 text-gray-500 hover:border-cyan-300/50"}`}
                              type="button"
                              onClick={() => setSharePreset(item.id)}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] app-muted">
                        <input
                          checked={shareIsOneTime}
                          type="checkbox"
                          onChange={(event) =>
                            setShareIsOneTime(event.target.checked)
                          }
                        />
                        One-time
                      </label>

                      {shareResult?.token && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Ready
                        </span>
                      )}

                      <Button
                        className="premium-share-cta px-4 py-2 !h-9 text-xs"
                        isDisabled={
                          isCreatingShare || shareableContacts.length === 0
                        }
                        onPress={async () => {
                          const minutes = toShareMinutes();

                          if (!activeChatId) {
                            setAlert?.("Open a chat first", "warning");

                            return;
                          }
                          if (!shareContactId) {
                            setAlert?.("Select a contact", "warning");

                            return;
                          }

                          const shared = shareableContacts.find(
                            (contact) =>
                              String(contact._id) === String(shareContactId),
                          );

                          if (!shared) {
                            setAlert?.("Select a contact", "warning");

                            return;
                          }

                          try {
                            setIsCreatingShare(true);
                            const res = await api.post("/share/create", {
                              contactId: shareContactId,
                              receiverId: activeChatId,
                              expiresInMinutes: minutes,
                              isOneTime: shareIsOneTime,
                            });

                            const generated = {
                              token: res.data.token,
                              expiresAt: res.data.expiresAt,
                              contactId: shareContactId,
                              contactName: shared.name,
                            };

                            setShareResult(generated);
                            pushShareToChat(activeChatId, generated);

                            const storageKey = user?._id
                              ? `last-share-contact:${user._id}`
                              : "last-share-contact";

                            localStorage.setItem(
                              storageKey,
                              String(shareContactId),
                            );

                            setShowSharePopup(false);
                            showToast("Contact shared inside chat", {
                              type: "message",
                              title: "Contact Share",
                              contactId: activeChatId,
                            });
                          } catch {
                            setAlert?.(
                              "Failed to generate secure share link",
                              "danger",
                            );
                          } finally {
                            setIsCreatingShare(false);
                          }
                        }}
                      >
                        {isCreatingShare ? "Sending..." : "Share"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  aria-label="Open contact share generator"
                  className="glass-action px-3 rounded-2xl text-lg"
                  title="Share contact"
                  type="button"
                  onClick={openInlineShareSheet}
                >
                  🔗
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className={`glass-action px-2 py-2 rounded-2xl text-xs ${temporaryMode ? "ring-1 ring-amber-300/60" : ""}`}
                    type="button"
                    onClick={() => setTemporaryMode((prev) => !prev)}
                  >
                    <i className="fas fa-hourglass-half" />
                    Temp
                  </button>
                  {temporaryMode && (
                    <select
                      className="glass-action px-2 py-2 rounded-2xl text-xs"
                      value={String(temporaryMinutes)}
                      onChange={(event) =>
                        setTemporaryMinutes(Number(event.target.value) || 60)
                      }
                    >
                      <option value="15">15m</option>
                      <option value="60">1h</option>
                      <option value="180">3h</option>
                      <option value="720">12h</option>
                    </select>
                  )}
                </div>
                <Input
                  placeholder="Type a message"
                  value={chatInput}
                  onChange={(event) => {
                    const value = event.target.value;

                    setChatInput(value);
                    if (!currentContactId) return;

                    if (!isTyping) {
                      setIsTyping(true);
                      socketService.emit("typing-start", {
                        contactId: currentContactId,
                      });
                      socketService.emit("typing", currentContactId);
                    }

                    if (typingStopTimer.current) {
                      window.clearTimeout(typingStopTimer.current);
                    }

                    typingStopTimer.current = window.setTimeout(() => {
                      setIsTyping(false);
                      socketService.emit("typing-stop", {
                        contactId: currentContactId,
                      });
                      socketService.emit("stopTyping", currentContactId);
                    }, 1200);
                  }}
                />
                <Button
                  className="neon-action px-5"
                  onPress={async () => {
                    if (!chatInput.trim() || !currentContactId) return;
                    const messageText = chatInput.trim();
                    const clientMessageId = `msg-${Date.now()}`;
                    const expiresAt = temporaryMode
                      ? new Date(
                          Date.now() + Math.floor(temporaryMinutes) * 60 * 1000,
                        ).toISOString()
                      : null;
                    
                    const optimistic: ChatMessage = {
                      contactId: currentContactId,
                      text: messageText,
                      sender: "user",
                      senderId: user?._id,
                      receiverId: currentContactId,
                      createdAt: new Date().toISOString(),
                      clientMessageId,
                      isTemporary: temporaryMode,
                      expiresAt,
                    };

                    // Optimistically add to UI
                    setMessagesByContact((prev) => ({
                      ...prev,
                      [currentContactId]: [
                        ...(prev[currentContactId] || []),
                        optimistic,
                      ],
                    }));
                    
                    setChatInput(""); // Clear input early for better UX

                    upsertSummary(currentContactId, {
                      name: currentContact?.name || "Unknown User",
                      lastMessage: messageText,
                      updatedAt: optimistic.createdAt,
                      unreadCount: 0,
                    });

                    // 1. Emit via socket INSTANTLY for real-time speed
                    socketService.emit("sendMessage", {
                      ...optimistic,
                      to: currentContactId,
                    });

                    // 2. Save to database in background for persistence
                    void api.post("/messages", {
                      senderId: user?._id,
                      receiverId: currentContactId,
                      text: messageText,
                      messageType: "text",
                      isTemporary: temporaryMode,
                      expiresAt,
                      clientMessageId,
                    }).catch((err) => {
                      console.error("Failed to persist message:", err);
                    });

                    console.info("Message sent (Socket instant, API background)", clientMessageId);

                    setIsTyping(false);
                    socketService.emit("typing-stop", {
                      contactId: currentContactId,
                    });
                    socketService.emit("stopTyping", currentContactId);
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
        {/* Incoming call accept UI removed from Calls tab. Only global modal/overlay will show incoming call. */}
        {selectedCall && (
          <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <p className="text-sm app-muted">Call actions</p>
            <p className="font-semibold">{selectedCall.name}</p>
            <div className="flex gap-2">
              <Button
                className="neon-action"
                onPress={() => {
                  void startOutgoingCall(
                    selectedCall.contactId,
                    "audio",
                    selectedCall.name,
                  );
                }}
              >
                Call Again
              </Button>
              <Button
                className="neon-action"
                onPress={() => {
                  void startOutgoingCall(
                    selectedCall.contactId,
                    "video",
                    selectedCall.name,
                  );
                }}
              >
                Video
              </Button>
              <Button
                className="glass-action"
                variant="flat"
                onPress={endCurrentCall}
              >
                End
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {callHistory.map((call) => {
            const typeMeta =
              call.type === "incoming"
                ? {
                    label: "Incoming",
                    icon: "fa-arrow-down",
                    color: "text-emerald-400",
                  }
                : call.type === "outgoing"
                  ? {
                      label: "Outgoing",
                      icon: "fa-arrow-up",
                      color: "text-sky-400",
                    }
                  : {
                      label: "Missed",
                      icon: "fa-phone-slash",
                      color: "text-rose-400",
                    };

            return (
              <div
                key={call.id}
                className={`w-full glass-card px-4 py-3 min-h-[72px] flex items-center justify-between gap-3 text-left cursor-pointer ${selectedCall?.id === call.id ? "ring-1 ring-cyan-300/50" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCall(call);
                  setCallPeerId(call.contactId);
                  setCallPeerName(call.name);
                  setActiveView("calls");
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setSelectedCall(call);
                  setCallPeerId(call.contactId);
                  setCallPeerName(call.name);
                  setActiveView("calls");
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="avatar-orb !w-11 !h-11 text-base">
                    {(call.name?.charAt(0) || "U").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold truncate">{call.name}</h4>
                    <p className="text-sm app-muted truncate">
                      {typeMeta.label} •{" "}
                      {new Date(call.time).toLocaleString([], {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs app-muted">
                    {call.duration > 0
                      ? `${Math.floor(call.duration / 60)
                          .toString()
                          .padStart(
                            2,
                            "0",
                          )}:${(call.duration % 60).toString().padStart(2, "0")}`
                      : "--:--"}
                  </span>
                  <i className={`fas ${typeMeta.icon} ${typeMeta.color}`} />
                  <Button
                    isIconOnly
                    aria-label="Call again"
                    className="glass-action !min-w-9 !w-9 !h-9"
                    onPress={() => {
                      void startOutgoingCall(
                        call.contactId,
                        "audio",
                        call.name,
                      );
                    }}
                  >
                    <i className="fas fa-phone" />
                  </Button>
                  <Button
                    isIconOnly
                    aria-label="Video call"
                    className="glass-action !min-w-9 !w-9 !h-9"
                    onPress={() => {
                      void startOutgoingCall(
                        call.contactId,
                        "video",
                        call.name,
                      );
                    }}
                  >
                    <i className="fas fa-video" />
                  </Button>
                </div>
              </div>
            );
          })}

          {callHistory.length === 0 && (
            <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
              No call history yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );

  const renderReminders = () => (
    <main className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold neon-title">Create Reminder</h3>
          <div className="flex flex-col gap-6">
            <Input
              placeholder="Message"
              value={reminderMessage}
              onChange={(event) => setReminderMessage(event.target.value)}
            />
            <Input
              placeholder="Contact"
              value={reminderContact}
              onChange={(event) => setReminderContact(event.target.value)}
            />
            <Input
              type="datetime-local"
              value={reminderDateTime}
              onChange={(event) => setReminderDateTime(event.target.value)}
            />
            <Button
              className="neon-action w-full"
              onPress={async () => {
                if (!reminderMessage || !reminderContact || !reminderDateTime)
                  return;
                try {
                  const matchedContact = contacts.find(
                    (contact) =>
                      contact.name.toLowerCase() ===
                      reminderContact.toLowerCase(),
                  );
                  const res = await api.post("/reminders", {
                    message: reminderMessage,
                    contactId: matchedContact?._id,
                    remindAt: reminderDateTime,
                    repeat,
                  });

                  setReminders((prev) => [res.data, ...prev]);
                } catch {
                  setAlert?.("Failed to create reminder", "danger");
                }
                setReminderMessage("");
                setReminderContact("");
                setReminderDateTime("");
                setRepeat("none");
              }}
            >
              Add Reminder
            </Button>
            <select
              className="w-full p-2 rounded-2xl border border-cyan-300/30 bg-transparent"
              value={repeat}
              onChange={(event) =>
                setRepeat(
                  event.target.value as
                    | "none"
                    | "today"
                    | "tomorrow"
                    | "monday"
                    | "tuesday"
                    | "wednesday"
                    | "thursday"
                    | "friday"
                    | "saturday"
                    | "sunday"
                    | "daily"
                    | "weekly"
                    | "monthly"
                )
              }
            >
              <option value="none">No Repeat</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold neon-title">
            Reminder Timeline
          </h3>
          <div className="flex flex-col gap-6">
            {reminders.map((reminder) => (
              <div
                key={reminder._id}
                className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
              >
                <p className="font-semibold">{reminder.message}</p>
                <p className="text-sm app-muted">
                  {contacts.find(
                    (contact) => contact._id === reminder.contactId,
                  )?.name || "General"}
                </p>
                <p className="text-xs app-muted">
                  {new Date(reminder.remindAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );

  const renderSettings = () => (
    <main className="p-6">
      <div className="glass-panel p-5 fade-in flex flex-col gap-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold neon-title mb-2">
          Profile Settings
        </h3>
        <section className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700 mb-2">
            Edit your details
          </label>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editName || !editEmail || !editPhone) return;
              try {
                await api.put("/auth/profile", {
                  name: editName,
                  email: editEmail,
                  phone: editPhone,
                });
                setAlert?.("Profile updated!", "success");
                // Optionally reload user info
                loadUser?.();
              } catch {
                setAlert?.("Failed to update profile", "danger");
              }
            }}
          >
            <div className="flex gap-4 items-center">
              <AppAvatar className="!w-12 !h-12" name={editName || "U"} />
              <input
                required
                className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                placeholder="Name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <input
              required
              className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              placeholder="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <input
              required
              className="rounded-lg border border-gray-200 px-3 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              placeholder="Phone number"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-md hover:shadow-lg transition-all rounded-xl h-11 mt-2"
              type="submit"
            >
              Save Changes
            </Button>
          </form>
        </section>
      </div>
    </main>
  );

  const renderSecureLinks = () => (
    <main className="w-full">
      <ShareGeneratorPage />
    </main>
  );

  const renderVault = () => (
    <main className="p-6">
      <div className="flex flex-col gap-6 fade-in w-full px-0 justify-items-start items-start">
        <div className="glass-panel-strong p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold neon-title">Smart Vault</h3>
            <p className="text-sm app-muted">
              Encrypted-looking workspace for secure notes and attachments.
            </p>
          </div>
          <PremiumButton>
            <i className="fas fa-plus" /> Add to Vault
          </PremiumButton>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PremiumCard>
            <p className="text-sm app-muted">Pinned Secure Notes</p>
            <ul className="flex flex-col gap-6">
              <li className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <i className="fas fa-note-sticky text-indigo-500" />
                Bank Manager Contact Strategy
              </li>
              <li className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <i className="fas fa-note-sticky text-indigo-500" />
                Top 20 VIP Follow-up Plan
              </li>
            </ul>
          </PremiumCard>
          <PremiumCard>
            <p className="text-sm app-muted">Encrypted Assets</p>
            <ul className="flex flex-col gap-6">
              <li className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <span>
                  <i className="fas fa-file-lines text-violet-300" />
                  nda_draft.pdf
                </span>
                <span className="text-xs app-muted">2.4MB</span>
              </li>
              <li className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <span>
                  <i className="fas fa-file-audio text-violet-300" />
                  client_call_note.m4a
                </span>
                <span className="text-xs app-muted">7.1MB</span>
              </li>
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
          <p className="text-sm app-muted">
            Engagement and communication trends across contacts, calls, and
            reminders.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PremiumCard className="xl:col-span-2">
            <p className="text-sm app-muted">Activity Trend</p>
            <div className="h-40 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 flex items-end gap-2 p-3">
              {[
                "h-[35%]",
                "h-[48%]",
                "h-[30%]",
                "h-[54%]",
                "h-[66%]",
                "h-[58%]",
                "h-[72%]",
                "h-[69%]",
                "h-[61%]",
                "h-[77%]",
                "h-[81%]",
                "h-[74%]",
              ].map((heightClass, idx) => (
                <span
                  key={idx}
                  className={`flex-1 rounded-2xl bg-gradient-to-t from-cyan-500/35 to-violet-400/75 ${heightClass}`}
                />
              ))}
            </div>
          </PremiumCard>
          <PremiumCard>
            <p className="text-sm app-muted">Conversion Pulse</p>
            <div className="flex flex-col gap-6">
              <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <span>Replies</span>
                <span className="text-indigo-500">82%</span>
              </div>
              <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <span>Calls Connected</span>
                <span className="text-indigo-500">74%</span>
              </div>
              <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                <span>Reminder Actions</span>
                <span className="text-indigo-500">67%</span>
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </main>
  );

  const renderAIAssistantPanel = () => {
    const aiItems = (dashboardInsights?.aiSuggestions || []).slice(0, 3);
    const fallbackItems = [
      "Reconnect with contact",
      "Follow up with pending contacts",
      "Clean up contacts",
    ];
    const suggestionList =
      aiItems.length > 0 ? aiItems.map((item) => item.message) : fallbackItems;

    return (
      <aside className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sticky top-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h4 className="text-[13px] font-bold text-slate-800 tracking-wider uppercase">
            Smart Suggestions
          </h4>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-green-200 uppercase tracking-widest">
            Live
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
          Smart suggestions to reconnect, follow-up, and keep your contact graph
          clean.
        </p>
        <div className="flex flex-col gap-3 mb-6">
          {suggestionList.map((message, index) => (
            <div
              key={`${message}-${index}`}
              className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
            >
              <p className="text-[13px] text-slate-700 font-medium mb-1">
                {message}
              </p>
              <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
                Priority: medium
              </p>
            </div>
          ))}
        </div>
        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-md hover:shadow-lg transition-all rounded-xl h-11">
          <i className="fas fa-sparkles mr-2" /> Ask AI
        </Button>
      </aside>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-96 w-full">
                <span className="relative flex h-12 w-12 mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-tr from-[#b46cff] via-[#6ee7b7] to-[#38bdf8] shadow-lg" />
                </span>
                <span className="text-base font-bold text-cyan-500 drop-shadow-[0_0_8px_#b46cff] animate-pulse">
                  Loading dashboard...
                </span>
              </div>
            }
          >
            {renderDashboard()}
          </Suspense>
        );
      case "contacts":
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-96 w-full">
                <span className="relative flex h-12 w-12 mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-tr from-[#b46cff] via-[#6ee7b7] to-[#38bdf8] shadow-lg" />
                </span>
                <span className="text-base font-bold text-cyan-500 drop-shadow-[0_0_8px_#b46cff] animate-pulse">
                  Loading contacts...
                </span>
              </div>
            }
          >
            {renderContacts()}
          </Suspense>
        );
      case "chat":
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-96 w-full">
                <span className="relative flex h-12 w-12 mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-tr from-[#b46cff] via-[#6ee7b7] to-[#38bdf8] shadow-lg" />
                </span>
                <span className="text-base font-bold text-cyan-500 drop-shadow-[0_0_8px_#b46cff] animate-pulse">
                  Loading chats...
                </span>
              </div>
            }
          >
            {renderChats()}
          </Suspense>
        );
      case "secure-links":
        return renderSecureLinks();
      case "vault":
        return renderVault();
      case "analytics":
        return renderAnalytics();
      case "calls":
        return renderCalls();
      case "reminder":
        return renderReminders();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  // Show a pastel neon loading spinner while loading
  if (loading || isAuthenticated === null) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-[#e0fff7] via-[#e6e6ff] to-[#ffe6fa] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <span className="relative flex h-16 w-16">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-60" />
            <span className="relative inline-flex rounded-full h-16 w-16 bg-gradient-to-tr from-[#b46cff] via-[#6ee7b7] to-[#38bdf8] shadow-lg" />
            <span className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-comments text-white text-3xl drop-shadow-[0_0_8px_#b46cff]" />
            </span>
          </span>
          <span className="text-lg font-bold text-cyan-500 drop-shadow-[0_0_8px_#b46cff] animate-pulse">
            Loading SmartContact...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Tray moved to GlobalSocketListener for 100% visibility stability */}
      <AppLayout
        rightPanel={undefined} 
        sidebar={
          <Sidebar
            activeKey={activeView}
            items={navItems}
            open={isSidebarOpen}
            subtitle="Management Workspace"
            title="SmartContact"
            onClose={() => setIsSidebarOpen(false)}
            onSelect={(key) => {
              if (key === "logout") {
                logout?.();
              } else {
                setActiveView(key as ViewKey);
              }
            }}
          />
        }
        topbar={
          <Topbar
            actions={
              <div className="flex items-center justify-end gap-1.5">
                <div className="relative">
                  <Button
                    isIconOnly
                    aria-label="Notifications"
                    className="text-gray-500 hover:text-indigo-500 transition-all duration-300"
                    variant="light"
                    onPress={() => {
                      if (
                        typeof window !== "undefined" &&
                        "Notification" in window &&
                        Notification.permission !== "granted"
                      ) {
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
                    <div className="absolute right-0 top-14 w-80 sm:w-96 glass-panel-strong border border-white/40 shadow-lg z-50 animate-slide-in origin-top-right">
                      <div className="flex items-center justify-between pb-3 border-b border-cyan-300/15">
                        <p className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <i className="fas fa-bell text-indigo-500" />{" "}
                          Notifications
                        </p>
                        <button
                          className="text-xs font-medium text-gray-500 hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            setNotifications([]);
                            setNotificationBadgeCount(0);
                          }}
                        >
                          Dismiss All
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto flex flex-col gap-4 pr-1">
                        {notifications.length === 0 && (
                          <div className="py-6 flex flex-col items-center justify-center text-gray-500 gap-2">
                            <i className="far fa-bell-slash text-2xl opacity-50" />
                            <p className="text-sm font-medium">
                              All caught up!
                            </p>
                          </div>
                        )}
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className="w-full text-left p-3 rounded-2xl  hover: border border-transparent hover:border-cyan-300/25 transition-all group"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <p className="text-sm font-semibold text-gray-500 group-hover:text-indigo-500 transition-colors line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-xs font-medium text-gray-500 line-clamp-2">
                              {notification.body}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  isIconOnly
                  aria-label="Messages"
                  className="text-gray-500 hover:text-indigo-500 transition-all duration-300"
                  variant="light"
                >
                  <i className="fas fa-envelope text-lg" />
                </Button>
                <ThemeSwitch />
                <div className="flex items-center gap-2">
                  <AppAvatar
                    className="!w-9 !h-9 border-2 border-cyan-300/30 shadow-cyan-500/30 cursor-pointer transition-all duration-300"
                    name={user?.name || "U"}
                  />
                  <span className="hidden lg:inline text-sm text-gray-500 font-medium">
                    {user?.name || "User"}
                  </span>
                </div>
              </div>
            }
            search={search}
            searchNode={
              <div className="topbar-search mx-auto">
                <PremiumInput
                  isClearable
                  classNames={{
                    inputWrapper:
                      "bg-transparent shadow-lg !border-none group-data-[focus=true]:bg-transparent hover:bg-transparent px-2 h-10",
                    input: "text-sm text-gray-500 placeholder:text-gray-500",
                  }}
                  placeholder={`Search ${activeView}...`}
                  startContent={
                    <i className="fas fa-magnifying-glass text-gray-500" />
                  }
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onClear={() => setSearch("")}
                />
              </div>
            }
            searchPlaceholder={`Search ${activeView}...`}
            title={activeView
              .replace("-", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onSearchChange={setSearch}
            onSearchClear={() => setSearch("")}
          />
        }
      >
        {renderContent()}
      </AppLayout>

      {/* Global Action Overlays */}

      {(callStatus !== "idle" || Boolean(incomingCall)) && (
        <div className="fixed inset-0 z-[140]  backdrop-blur-sm flex flex-col transition-all duration-300">
          <div className="px-5 sm:px-8 pt-6 pb-3 flex items-start justify-between text-gray-500">
            <div>
              <p className="text-xl sm:text-2xl font-semibold tracking-wide">
                {callPeerName ||
                  incomingCall?.fromName ||
                  incomingCall?.from ||
                  "Unknown"}
              </p>
              <p className="text-sm text-indigo-500/90 capitalize">
                {callStatus === "connected"
                  ? `Connected • ${formatCallTimer(callTimer)}`
                  : callStatus === "incoming"
                    ? "Incoming"
                    : callStatus === "calling"
                      ? "Calling"
                      : callStatus === "ringing"
                        ? "Ringing"
                        : callStatus === "failed"
                          ? "Call failed"
                          : callStatus === "ended"
                            ? "Call ended"
                            : "Calling"}
              </p>
              {callError && (
                <p className="text-xs text-rose-300">{callError}</p>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {callMode === "video" ? "Video" : "Voice"} Call
            </p>
          </div>

          <div className="flex-1 px-4 sm:px-8 pb-4 flex items-center justify-center relative">
            {callMode === "video" ? (
              <div className="w-full max-w-6xl h-full grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 opacity-100">
                <div className="relative glass-panel p-2 min-h-[220px] md:min-h-[360px] overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover rounded-2xl ${!remoteStreamRef.current ? "hidden" : "block"}`}
                  />
                  {!remoteStreamRef.current && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-900/10 rounded-2xl">
                      <div className="avatar-orb !w-20 !h-20 text-2xl">
                        {(callPeerName || incomingCall?.fromName || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <p className="text-xs text-gray-500 font-medium animate-pulse">
                        {callStatus === "connected" ? "Connecting video..." : "Waiting for answer..."}
                      </p>
                    </div>
                  )}
                  <span className="absolute left-4 top-3 text-xs px-2 py-1 rounded-full bg-black/45 text-white">
                    Remote
                  </span>
                </div>
                <div className="relative glass-panel p-2 min-h-[220px] md:min-h-[360px] overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl "
                  />
                  <span className="absolute left-4 top-3 text-xs px-2 py-1 rounded-full bg-black/45 text-white">
                    You
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl h-full flex flex-col items-center justify-center gap-6 transition-all duration-300">
                <div className="avatar-orb !w-36 !h-36 sm:!w-44 sm:!h-44 text-5xl sm:text-6xl shadow-[0_0_55px_-14px_rgba(34,179,239,0.95)]">
                  {(callPeerName || incomingCall?.fromName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                {/* No video elements for audio call */}
                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                {(callStatus === "ringing" || callStatus === "incoming") && (
                  <p className="text-sm text-indigo-500 animate-pulse">
                    Waiting for connection...
                  </p>
                )}
              </div>
            )}

            {/* Real-time chat panel during call */}
            {(callStatus === "connected" || callStatus === "ringing" || callStatus === "incoming") && callPeerId && showCallChat && (
              <div className="absolute right-0 top-0 h-full w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/90 glass-panel-strong border-l border-cyan-200/30 shadow-2xl z-30 flex flex-col" style={{width: 340}}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-200/30">
                  <span className="font-semibold text-indigo-600">Call Chat</span>
                  <button className="text-xs text-gray-400 hover:text-indigo-500" onClick={() => setShowCallChat(false)}>
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2" style={{minHeight: 0}}>
                  {(messagesByContact[callPeerId] || []).map((msg, idx) => {
                    const isMe = String(msg.senderId) === String(user?._id || "") || (!msg.senderId && msg.sender === "user");
                    return (
                      <div key={msg._id || msg.clientMessageId || idx} className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-xl px-3 py-2 text-sm ${isMe ? "bg-cyan-100 text-cyan-900" : "bg-gray-100 text-gray-700"}`}>{msg.text}</div>
                      </div>
                    );
                  })}
                  <div ref={chatScrollRef} />
                </div>
                <form className="flex gap-2 p-2 border-t border-cyan-200/30" onSubmit={e => {
                  e.preventDefault();
                  if (!callChatInput.trim()) return;
                  const messageText = callChatInput.trim();
                  const clientMessageId = `callchat-${Date.now()}`;
                  const optimistic: ChatMessage = {
                    contactId: callPeerId,
                    text: messageText,
                    sender: "user",
                    createdAt: new Date().toISOString(),
                    clientMessageId,
                  };
                  setMessagesByContact(prev => ({
                    ...prev,
                    [callPeerId]: [...(prev[callPeerId] || []), optimistic],
                  }));
                  socketService.emit("sendMessage", {
                    senderId: user?._id,
                    receiverId: callPeerId,
                    message: messageText,
                    clientMessageId,
                  });
                  setCallChatInput("");
                }}>
                  <Input
                    className="flex-1"
                    placeholder="Type a message..."
                    value={callChatInput}
                    onChange={e => setCallChatInput(e.target.value)}
                  />
                  <Button type="submit" className="neon-action px-4">Send</Button>
                </form>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-8 pb-8 pt-2">
            {callStatus === "incoming" && incomingCall ? (
              <div className="mx-auto w-full max-w-xl glass-panel rounded-2xl p-5 transition-all duration-300">
                <p className="text-lg font-semibold text-gray-500">
                  Incoming Call
                </p>
                <p className="text-sm app-muted">
                  {incomingCall.fromName || incomingCall.from || "Unknown"}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:brightness-110 transition-all duration-300"
                    type="button"
                    onClick={acceptIncomingCall}
                  >
                    <i className="fas fa-phone mr-2" />
                    Accept
                  </button>
                  <button
                    className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-semibold shadow-[0_0_20px_rgba(244,63,94,0.55)] hover:brightness-110 transition-all duration-300"
                    type="button"
                    onClick={rejectIncomingCall}
                  >
                    <i className="fas fa-phone-slash mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300">
                <button
                  className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[84px] sm:min-w-[98px] text-xs sm:text-sm transition-all ${isMuted ? "ring-1 ring-amber-300/60 bg-amber-400/10" : ""}`}
                  type="button"
                  onClick={toggleMute}
                >
                  {isMuted ? "🔇 Unmute" : "🔇 Mute"}
                </button>
                <button
                  className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[84px] sm:min-w-[98px] text-xs sm:text-sm transition-all ${isCameraOff ? "ring-1 ring-amber-300/60 bg-amber-400/10" : ""}`}
                  type="button"
                  onClick={toggleCamera}
                >
                  {isCameraOff ? "🎥 On" : "🎥 Off"}
                </button>
                <button
                  className={`glass-action px-3 sm:px-4 py-3 rounded-full min-w-[90px] sm:min-w-[106px] text-xs sm:text-sm transition-all ${isSpeakerOn ? "ring-1 ring-cyan-300/55 bg-cyan-500/10" : ""}`}
                  type="button"
                  onClick={toggleSpeaker}
                >
                  {isSpeakerOn ? "🔊 Speaker" : "🔈 Speaker"}
                </button>
                <button
                  className="glass-action px-3 sm:px-4 py-3 rounded-full min-w-[110px] text-xs sm:text-sm transition-all"
                  type="button"
                  onClick={async () => {
                    // Switch between audio and video
                    const newMode = callMode === "video" ? "audio" : "video";
                    setCallMode(newMode);
                    // Replace local media tracks
                    if (localStreamRef.current) {
                      localStreamRef.current.getTracks().forEach((t) => t.stop());
                    }
                    try {
                      const newStream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: newMode === "video",
                      });
                      localStreamRef.current = newStream;
                      if (localVideoRef.current) {
                        localVideoRef.current.srcObject = newStream;
                      }
                      // Replace tracks in peer connection
                      const pc = peerConnectionRef.current;
                      if (pc) {
                        const senders = pc.getSenders();
                        // Replace audio track
                        const audioTrack = newStream.getAudioTracks()[0];
                        const videoTrack = newStream.getVideoTracks()[0];
                        senders.forEach((sender) => {
                          if (sender.track?.kind === "audio" && audioTrack) {
                            sender.replaceTrack(audioTrack);
                          }
                          if (sender.track?.kind === "video") {
                            if (videoTrack) {
                              sender.replaceTrack(videoTrack);
                            } else {
                              sender.replaceTrack(null);
                            }
                          }
                        });
                        // Renegotiate
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socketService.emit("callRenegotiate", {
                          to: callPeerId,
                          offer,
                          type: newMode,
                        });
                      }
                    } catch (err) {
                      setCallError("Failed to switch mode");
                    }
                  }}
                >
                  {callMode === "video" ? "Switch to Audio" : "Switch to Video"}
                </button>
                <button
                  className="px-4 sm:px-5 py-3 rounded-full min-w-[92px] sm:min-w-[110px] bg-rose-500 text-gray-800 font-semibold shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02]"
                  type="button"
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
