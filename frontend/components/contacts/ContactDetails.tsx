"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import api from "../../utils/api";
import { ContactContext } from "../../context/contact/ContactContext";

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
  const [activeTab, setActiveTab] = useState<"chats" | "calls">("chats");
  const [newInteraction, setNewInteraction] = useState<{
    type: string;
    notes: string;
  }>({ type: "call", notes: "" });

  useEffect(() => {
    const ensureContact = async () => {
      try {
        const res = await api.get(`/contacts/${id}`);

        if (setCurrent) {
          setCurrent(res.data);
        }
      } catch {
        router.push("/");
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
        const res = await api.get(`/messages/${id}`);

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
        const res = await api.get("/interactions/calls");
        const selectedUserId = String(
          (current as any)?.userId || (current as any)?.linkedUserId || "",
        );
        const filteredCalls = (Array.isArray(res.data) ? res.data : []).filter(
          (call: any) => {
            const callContactId = String(call?.contactId || "");

            return (
              callContactId === String(id) ||
              (selectedUserId && callContactId === selectedUserId)
            );
          },
        );

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
      await api.post("/interactions", {
        contactId: id,
        ...newInteraction,
      });

      // fetchInteractions();
      setNewInteraction({ type: "call", notes: "" });
      // Could accept a toast here
    } catch (err) {
      console.error(err);
      alert("Error logging interaction");
    }
  };

  const handleShare = () => {
    const params = new URLSearchParams();

    params.set("contactId", String(id));

    const query = params.toString();

    router.push(query ? `/share-generator?${query}` : "/share-generator");
  };

  if (!current)
    return <div className="p-4 text-gray-500">Loading contact...</div>;

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

  const resolvedRelationship = relationshipType || purpose || "other";
  const resolvedPriority = (
    priorityLevel ||
    priority ||
    "medium"
  ).toLowerCase();
  const priorityColor =
    resolvedPriority === "high"
      ? "danger"
      : resolvedPriority === "medium"
        ? "warning"
        : "success";
  const targetUserId = String(
    (current as any)?.userId || (current as any)?.linkedUserId || "",
  );
  const canCommunicate = Boolean(targetUserId);
  const toLabel = (value?: string) => {
    if (!value) return "Other";

    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const openRealtimeChat = () => {
    if (!targetUserId) return;
    const params = new URLSearchParams();

    params.set("view", "chat");
    params.set("chatWith", String(targetUserId));
    router.push(`/?${params.toString()}`);
  };

  const startRealtimeCall = (mode: "audio" | "video") => {
    if (!targetUserId) return;
    const params = new URLSearchParams();

    params.set("view", "chat");
    params.set("chatWith", String(targetUserId));
    params.set("call", mode);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-6 fade-in">
      <Button
        className="glass-action text-gray-500"
        startContent={<i className="fas fa-arrow-left" />}
        variant="light"
        onPress={() => router.push("/")}
      >
        Back to Contacts
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex items-start justify-between gap-3 border-b border-cyan-300/15">
            <div className="flex flex-col">
              <p className="text-lg text-indigo-500 font-semibold">{name}</p>
              <p className="text-small text-gray-500">
                {toLabel(resolvedRelationship)}
              </p>
            </div>
            <Chip color={priorityColor as any} variant="flat">
              {toLabel(resolvedPriority)}
            </Chip>
          </CardHeader>
          <CardBody className="pt-4">
            <ul className="flex flex-col gap-6 text-gray-500/95">
              <li>
                <i className="fas fa-phone opacity-70" /> {phone}
              </li>
              <li>
                <i className="fas fa-envelope opacity-70" /> {email}
              </li>
              <li>
                <strong>Relationship:</strong> {toLabel(resolvedRelationship)}
              </li>
              <li>
                <strong>Met at:</strong> {toLabel(meetContext || "other")}
              </li>
              <li>
                <strong>Relationship Score:</strong> {relationshipScore}
              </li>
              <li>
                <strong>Notes:</strong> {notes || "No notes"}
              </li>
            </ul>
          </CardBody>
          <CardFooter className="flex flex-wrap gap-2 border-t border-cyan-300/15 pt-4">
            <Button
              className="neon-action"
              isDisabled={!canCommunicate}
              onPress={openRealtimeChat}
            >
              <i className="fas fa-comments" /> Chat
            </Button>
            <Button
              className="glass-action text-gray-500"
              isDisabled={!canCommunicate}
              onPress={() => startRealtimeCall("audio")}
            >
              <i className="fas fa-phone" /> Call
            </Button>
            <Button
              className="glass-action text-gray-500"
              isDisabled={!canCommunicate}
              onPress={() => startRealtimeCall("video")}
            >
              <i className="fas fa-video" /> Video Call
            </Button>
            {!canCommunicate && (
              <span className="text-xs text-gray-500">
                User not on platform
              </span>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Tabs for history */}
      <div className="">
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
          <button
            className={`px-4 py-2 rounded-2xl font-semibold transition-all ${activeTab === "chats" ? "bg-cyan-500/25 text-indigo-500" : "text-gray-500 hover:"}`}
            onClick={() => setActiveTab("chats")}
          >
            Chats
          </button>
          <button
            className={`px-4 py-2 rounded-2xl font-semibold transition-all ${activeTab === "calls" ? "bg-cyan-500/25 text-indigo-500" : "text-gray-500 hover:"}`}
            onClick={() => setActiveTab("calls")}
          >
            Calls
          </button>
        </div>
        {activeTab === "chats" && (
          <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader>
              <p className="font-semibold text-indigo-500">Chat History</p>
            </CardHeader>
            <CardBody>
              {loadingMessages ? (
                <p>Loading...</p>
              ) : (
                <ul className="flex flex-col gap-6">
                  {messages.length === 0 && (
                    <li className="text-gray-500">No messages</li>
                  )}
                  {messages.map((msg: any) => (
                    <li
                      key={msg._id}
                      className={`p-2 rounded-2xl border ${msg.senderId === current.userId ? "bg-cyan-500/15 border-cyan-400/20 text-right" : " border-slate-600/30 text-left"}`}
                    >
                      <span className="block text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      <span>{msg.text || msg.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}
        {activeTab === "calls" && (
          <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader>
              <p className="font-semibold text-indigo-500">Call History</p>
            </CardHeader>
            <CardBody>
              {loadingCalls ? (
                <p>Loading...</p>
              ) : (
                <ul className="flex flex-col gap-6">
                  {calls.length === 0 && (
                    <li className="text-gray-500">No calls</li>
                  )}
                  {calls.map((call: any) => (
                    <li
                      key={call._id}
                      className="p-2 rounded-2xl  border border-slate-600/30 flex justify-between items-center"
                    >
                      <span>
                        <i
                          className={`fas ${call.type === "incoming" || call.type === "call_incoming" ? "fa-arrow-down" : call.type === "outgoing" || call.type === "call_outgoing" ? "fa-arrow-up" : "fa-times"}`}
                        />
                        {(call.type || "").replace("call_", "")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(
                          call.time || call.timestamp || call.createdAt,
                        ).toLocaleString()}
                      </span>
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
