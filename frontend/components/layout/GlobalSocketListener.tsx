"use client";

import React, { useEffect, useContext, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";

import { AuthContext } from "../../context/auth/AuthContext";
import { ContactContext } from "../../context/contact/ContactContext";
import socketService from "../../utils/socketService";
import api from "../../utils/api";

type RealtimeNotification = {
  id: string;
  type: "message" | "reminder" | "call";
  title: string;
  body: string;
  senderId?: string;
  contactId?: string;
  createdAt: string;
};

export default function GlobalSocketListener() {
  const authContext = useContext(AuthContext);
  const contactContext = useContext(ContactContext);
  const contacts = contactContext?.contacts || [];
  const [toasts, setToasts] = useState<RealtimeNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onNewMessage = useCallback((message: any) => {
    console.log("[Socket] Message Arrived!", message);
    const senderId = message.senderId;
    // Removed the "NOT from self" filter so ALL messages (even from the user) will pop up
    // if (senderId === selfId) return;

    const matchingContact = (contacts || []).find(c => 
      String(c.linkedUserId) === senderId || String(c._id) === senderId
    );
    const senderName = matchingContact ? matchingContact.name : "Someone";

    const notificationId = `msg-${Date.now()}`;
    const newToast: RealtimeNotification = {
      id: notificationId,
      type: "message",
      title: `Message from ${senderName}`,
      body: message.text || "Sent a message",
      senderId: senderId,
      createdAt: new Date().toISOString()
    };

    setToasts((prev) => [newToast, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== notificationId));
    }, 10000);

    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.play().catch(() => {
       console.warn("[Socket] Audio blocked");
    });
  }, [authContext?.user?._id, contacts]);

  const triggerToast = useCallback((payload: RealtimeNotification) => {
    setToasts((prev) => [payload, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== payload.id));
    }, 10000);
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audio.play().catch(() => {});
  }, []);

  const onNotification = useCallback((payload: any) => {
    console.log("[Socket] Notification Arrived!", payload);
    const notificationId = payload.id || `notif-${Date.now()}`;
    triggerToast({
      id: notificationId,
      type: payload.type || "message",
      title: payload.title || "Notification",
      body: payload.body || "",
      senderId: payload.senderId,
      createdAt: payload.createdAt || new Date().toISOString()
    });
  }, [triggerToast]);

  const onReminderDue = useCallback((payload: any) => {
    triggerToast({
      id: `rem-${Date.now()}`,
      type: "reminder",
      title: "Reminder Due",
      body: payload.message || "A reminder is due",
      createdAt: new Date().toISOString()
    });
  }, [triggerToast]);

  const onAIReminderDue = useCallback((payload: any) => {
    triggerToast({
      id: `ai-${Date.now()}`,
      type: "reminder",
      title: "AI Suggestion",
      body: payload.message || "New AI suggestion",
      createdAt: new Date().toISOString()
    });
  }, [triggerToast]);

  useEffect(() => {
    if (!mounted || !authContext?.user || !authContext?.token) return;

    socketService.connect(authContext.user._id, authContext.token);
    socketService.on("receiveMessage", onNewMessage);
    socketService.on("notification", onNotification);
    socketService.on("reminder-due", onReminderDue);
    socketService.on("ai-reminder-due", onAIReminderDue);
    
    return () => {
      socketService.off("receiveMessage", onNewMessage);
      socketService.off("notification", onNotification);
      socketService.off("reminder-due", onReminderDue);
      socketService.off("ai-reminder-due", onAIReminderDue);
    };
  }, [mounted, authContext?.user, authContext?.token, onNewMessage, onNotification, onReminderDue, onAIReminderDue]);

  // AI & Manual Reminder Poller
  useEffect(() => {
    if (!mounted || !authContext?.user || !authContext?.token) return;

    const notifiedIds = new Set<string>();

    const checkReminders = async () => {
      try {
        const aiRes = await api.get("/ai-reminders");
        const manRes = await api.get("/reminders");
        const now = new Date().getTime();

        for (const rem of manRes.data) {
          if (rem.isActive && new Date(rem.remindAt).getTime() <= now && !notifiedIds.has(rem._id)) {
            notifiedIds.add(rem._id);
            const notificationId = `rem-${rem._id}`;
            triggerToast({
              id: notificationId,
              type: "reminder",
              title: "Reminder",
              body: rem.message,
              createdAt: new Date().toISOString()
            });
            await api.patch(`/reminders/${rem._id}/toggle`, {});
          }
        }

        for (const aiRem of aiRes.data) {
          if (!aiRem.isRead && !notifiedIds.has(aiRem._id)) {
            notifiedIds.add(aiRem._id);
            const notificationId = `ai-${aiRem._id}`;
            triggerToast({
              id: notificationId,
              type: "reminder",
              title: "AI Suggestion",
              body: aiRem.message,
              createdAt: new Date().toISOString()
            });
            await api.patch(`/ai-reminders/${aiRem._id}/read`, {});
          }
        }
      } catch (err: any) {
        console.log("Polling stopped:", err.message);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [mounted, authContext?.user, authContext?.token, triggerToast]);

  // Global Health Check
  useEffect(() => {
    if (!mounted || !authContext?.user) return;
    console.log("[Socket] Health Check: Global Listener is MOUNTED and WAITING.");
    const interval = setInterval(() => {
       console.log("[Socket] Pulse: Listening for incoming events...");
    }, 60000);
    return () => clearInterval(interval);
  }, [mounted, authContext?.user]);

  if (!mounted) return null;

  return (
    <>
      <Toaster />
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 items-end pointer-events-none w-80">
        {toasts.map((t) => (
          <div 
             key={t.id} 
             className={`p-4 rounded-2xl shadow-2xl animate-fade-in-up pointer-events-auto border backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
               t.type === "reminder" 
                ? "bg-amber-50/90 border-amber-200 text-amber-900" 
                : "bg-white/90 border-white/50 text-gray-800"
             }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${
                t.type === "reminder" ? "bg-amber-200 text-amber-700" : "bg-indigo-100 text-indigo-600"
              }`}>
                <i className={`fas ${t.type === "reminder" ? "fa-bell" : "fa-message"} text-sm`} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold tracking-tight mb-0.5 uppercase opacity-80">
                  {t.type === "reminder" ? "Reminder" : "Message"}
                </p>
                <p className="text-sm font-semibold leading-tight mb-1">
                  {t.title}
                </p>
                <p className="text-xs opacity-70 line-clamp-2">
                  {t.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
