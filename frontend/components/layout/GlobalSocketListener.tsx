'use client';

import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import socketService from '../../utils/socketService';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter, usePathname } from 'next/navigation';
import api from '../../utils/api';
// @ts-ignore

export default function GlobalSocketListener() {
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const isConnected = true;
  const setIsConnected = (val: boolean) => {};

  // Safe audio loading
  const notifySound = null;
  const callSound = null;

  useEffect(() => {
    if (!authContext?.user || !authContext?.token) return;

    socketService.connect(authContext.user._id, authContext.token);

    if ((socketService as any).socket) {
      (socketService as any).socket.on('connect', () => {
        if (!isConnected) {
          toast.success("Reconnected to chat server!", { id: "connection-status" });
          setIsConnected(true);
        }
      });

      (socketService as any).socket.on('disconnect', () => {
        toast.error("Connection lost. Reconnecting...", { id: "connection-status", duration: 5000 });
        setIsConnected(false);
      });
    }

    // Chat Notification
    const handleMessage = (msg: any) => {
      // Don't pop if currently inside that user's chat
      if (pathname.includes(`/chat/${msg.senderId}`) || pathname.includes(`/chat/${msg.sender}`)) {
        return;
      }
      
      (notifySound as any)?.play();
      toast.custom((t) => (
        <div
          className={`${
 t.visible ? 'animate-enter' : 'animate-leave'
 } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
          onClick={() => {
            toast.dismiss(t.id);
            router.push(`/chat/${msg.senderId}`);
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-1">
                 <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New message from {msg.senderName || "Contact"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {msg.text?.substring(0, 40)}{msg.text?.length > 40 ? '...' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 4000 });
    };

    // Incoming Call Popup
    const handleIncomingCall = (data: any) => {
      (callSound as any)?.play();
      toast.custom((t) => (
        <div className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div className="p-4">
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white animate-pulse">
               Incoming call...
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-300">
               <i className="fas fa-user-circle text-4xl block text-gray-400"></i>
               {data.fromName || "User"} is calling you
            </p>
            <div className="flex px-4 gap-4 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                  (callSound as any)?.stop();
                  router.push(`/call/${data.from}?name=${encodeURIComponent(data.fromName)}&incoming=true`);
                }}
                className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
              >
                Accept 
              </button>
              <button
                onClick={(e) => {
                   e.stopPropagation();
                   toast.dismiss(t.id);
                   (callSound as any)?.stop();
                   socketService.emit("endCall", { to: data.from });
                }}
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                End
              </button>
            </div>
          </div>
        </div>
      ), { duration: 30000, id: 'incomingCallToast' });
    };

    socketService.on('receiveMessage', handleMessage);
    socketService.on('incomingCall', handleIncomingCall);
    socketService.on("callEnded", () => {
       toast.dismiss('incomingCallToast');
       (callSound as any)?.stop();
    });

    return () => {
      socketService.off('receiveMessage', handleMessage);
      socketService.off('incomingCall', handleIncomingCall);
      socketService.off('callEnded');
    };
  }, [authContext?.user, authContext?.token, isConnected, pathname]);

  // AI & Manual Reminder Poller
  useEffect(() => {
    if (!authContext?.user || !authContext?.token) return;

    // Track recently notified IDs to prevent duplicates in a single sync
    const notifiedIds = new Set<string>();

    const checkReminders = async () => {
      try {
        // Fetch reminders
        const aiRes = await api.get("/ai-reminders");

        const manRes = await api.get('/reminders');

        const now = new Date().getTime();
        
        // Manual Reminders
        for (const rem of manRes.data) {
          if (rem.isActive && new Date(rem.remindAt).getTime() <= now && !notifiedIds.has(rem._id)) {
            notifiedIds.add(rem._id);
            toast.custom((t) => (
              <div className="max-w-sm w-full bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 shadow-lg rounded-r-lg pointer-events-auto p-4 cursor-pointer"
                   onClick={() => toast.dismiss(t.id)}>
                <div className="flex items-center">
                   <i className="fas fa-bell text-blue-500 text-xl"></i>
                   <div>
                     <p className="font-bold text-blue-900 dark:text-blue-100">Reminder</p>
                     <p className="text-sm text-blue-700 dark:text-blue-200">{rem.message}</p>
                   </div>
                </div>
              </div>
            ), { duration: 10000 });
            
            await api.patch(`/reminders/${rem._id}/toggle`, {});
          }
        }

        // AI Reminders
        for (const aiRem of aiRes.data) {
          if (!aiRem.isRead && !notifiedIds.has(aiRem._id)) {
            notifiedIds.add(aiRem._id);
            toast.custom((t) => (
              <div className="max-w-sm w-full bg-purple-50 dark:bg-purple-900 border-l-4 border-purple-500 shadow-lg rounded-r-lg pointer-events-auto p-4 cursor-pointer"
                   onClick={() => toast.dismiss(t.id)}>
                <div className="flex items-center">
                   <i className="fas fa-robot text-purple-500 text-xl"></i>
                   <div>
                     <p className="font-bold text-purple-900 dark:text-purple-100">AI Suggestion</p>
                     <p className="text-sm text-purple-700 dark:text-blue-200">{aiRem.message}</p>
                   </div>
                </div>
              </div>
            ), { duration: 15000 });

            await api.patch(`/ai-reminders/${aiRem._id}/read`, {});
          }
        }

      } catch (err: any) {
        console.log("Polling stopped:", err.message);
      }
    };

    // Run immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 5000);

    return () => clearInterval(interval);
  }, [authContext?.user, authContext?.token]);

  return (
    <>
      <Toaster position="top-right" />
    </>
  );
}