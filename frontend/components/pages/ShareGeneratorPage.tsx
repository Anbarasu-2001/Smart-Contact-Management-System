"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import api from "../../utils/api";
import { AuthContext } from "../../context/auth/AuthContext";
import { ContactContext } from "../../context/contact/ContactContext";
import { AlertContext } from "../../context/alert/AlertContext";
import socketService from "../../utils/socketService";

type ExpiryPreset = "5m" | "10m" | "1h" | "custom";

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
    // Time sync for expiry accuracy
    const [timeOffset, setTimeOffset] = useState(0);
    const syncWithServer = useCallback((serverTime: string) => {
      if (!serverTime) return;
      const serverDate = new Date(serverTime);
      const offset = serverDate.getTime() - Date.now();
      setTimeOffset(offset);
    }, []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const authContext = useContext(AuthContext);
  const contactContext = useContext(ContactContext);
  const alertContext = useContext(AlertContext);

  const { user, isAuthenticated, loadUser } = authContext || {};
  const { contacts = [], getContacts } = contactContext || {};
  const [sharedContacts, setSharedContacts] = useState<any[]>([]);
  const { setAlert } = alertContext || {};

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryReceiverId = searchParams?.get("receiverId") || "";
  const queryContactId = searchParams?.get("contactId") || "";

  const [selectedContactId, setSelectedContactId] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("10m");
  const [customExpiry, setCustomExpiry] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!isAuthenticated) {
      void loadUser?.();
    }
    void getContacts?.();

    // Fetch all share links where the user is the receiver
    (async () => {
      try {
        const res = await api.get("/share/mine");
        const links = res.data?.links || [];
        // Only include active, non-expired shares where user is receiver
        const now = Date.now();
        const filtered = links.filter(
          (link: any) =>
            String(link.receiverId) === String(user?._id) &&
            link.isActive &&
            (!link.expiresAt || new Date(link.expiresAt).getTime() > now)
        );
        // Map to contact objects (avoid duplicates by contactId)
        const unique: Record<string, any> = {};
        for (const link of filtered) {
          if (link.contactId && !unique[link.contactId]) {
            unique[link.contactId] = {
              _id: link.contactId,
              name: link.contactName || (link.contactId?.name ?? "Unknown Contact"),
              phone: link.contactId?.phone || "",
              email: link.contactId?.email || "",
              // Add any other fields as needed
            };
          }
        }
        setSharedContacts(Object.values(unique));
      } catch {
        setSharedContacts([]);
      }
    })();
  }, [getContacts, isAuthenticated, loadUser, router, user?._id]);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const res = await api.get("/messages/summaries");

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
    const match =
      contacts.find((item) => String(item?._id) === queryContactId)?._id || "";

    if (match) setSelectedContactId(match);
  }, [contacts, queryContactId, selectedContactId]);

  const receiverOptions = useMemo(() => {
    const fromChats = (chatSummaries || [])
      .sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
      )
      .map((summary) => ({
        id: summary.userId,
        name: summary.name || "Unknown User",
        subtitle: summary.lastMessage
          ? `Recent: ${summary.lastMessage}`
          : "Recent chat",
      }));

    const merged = new Map<string, ReceiverOption>();

    for (const item of fromChats) {
      if (!item.id || item.id === user?._id) continue;
      merged.set(item.id, item);
    }

    return Array.from(merged.values());
  }, [chatSummaries, user?._id]);

  const selectedContact = useMemo(
    () =>
      contacts.find((item) => String(item._id) === selectedContactId) || null,
    [contacts, selectedContactId],
  );

  const selectedReceiver = useMemo(
    () => receiverOptions.find((item) => item.id === receiverId) || null,
    [receiverOptions, receiverId],
  );

  useEffect(() => {
    if (receiverId || queryReceiverId) return;
    const latest = receiverOptions[0]?.id || "";

    if (latest) setReceiverId(latest);
  }, [queryReceiverId, receiverId, receiverOptions]);

  // Merge user's own contacts and shared contacts (avoid duplicates)
  const allContacts = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of contacts as any[]) {
      if (c && c._id) map.set(String(c._id), c);
    }
    for (const c of sharedContacts as any[]) {
      if (c && c._id && !map.has(String(c._id))) map.set(String(c._id), c);
    }
    return Array.from(map.values());
  }, [contacts, sharedContacts]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return allContacts.filter((item) => Boolean(item._id));
    return allContacts.filter((item) => {
      if (!item?._id) return false;
      const name = String(item.name || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [contactSearch, allContacts]);

  const recentReceivers = useMemo(
    () => receiverOptions.slice(0, 4),
    [receiverOptions],
  );

  const filteredReceivers = useMemo(() => {
    const query = receiverSearch.trim().toLowerCase();

    if (!query) return receiverOptions;

    return receiverOptions.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query),
    );
  }, [receiverOptions, receiverSearch]);

  const expiresInMinutes = useMemo(() => {
    if (expiryPreset === "custom") {
      const val = parseInt(customExpiry, 10);

      return Number.isFinite(val) && val > 0 ? val : 10;
    }
    if (expiryPreset === "5m") return 5;
    if (expiryPreset === "10m") return 10;

    return 60;
  }, [expiryPreset, customExpiry]);

  const expiresAt = useMemo(() => {
    if (!mounted || !expiresInMinutes) return null;
    return new Date(Date.now() + timeOffset + expiresInMinutes * 60 * 1000).toISOString();
  }, [expiresInMinutes, mounted, timeOffset]);

  const generateAndSend = useCallback(async () => {
    if (!user?._id || !selectedContactId || !receiverId) {
      if (!selectedContactId) {
        setAlert?.("Select a contact", "warning");

        return;
      }
      setAlert?.("Select receiver", "warning");

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setAlert?.("Please log in again", "danger");

      return;
    }

    try {
      setIsSending(true);

      const shareRes = await api.post("/share/create", {
        contactId: selectedContactId,
        receiverId,
        expiresInMinutes,
        isOneTime: false, // Default to false, or replace with state if you add a toggle
      });

      // Sync time with server for expiry accuracy
      syncWithServer(shareRes.data.serverTime);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] ShareGenerator backend response:', shareRes.data);
      }

      const payload = {
        messageType: "contact_share" as const,
        sharedContactId: selectedContactId,
        shareToken: shareRes.data.token,
        sharedContactName: selectedContact?.name || "Contact",
        shareExpiresAt: shareRes.data.expiresAt,
        sharePayload: {
          type: "contact_share" as const,
          contactId: selectedContactId,
          token: shareRes.data.token,
          expiresAt: shareRes.data.expiresAt,
        },
      };

      // Debug log payload sent to chat
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] ShareGenerator payload to chat:', payload);
      }

      socketService.connect(user._id, token);
      socketService.emit("sendMessage", {
        senderId: user._id,
        receiverId,
        message: "Contact access granted",
        clientMessageId: `share-${Date.now()}`,
        ...payload,
      });

      setAlert?.("✅ Contact Sent", "success");
      window.setTimeout(() => {
        router.push("/");
      }, 900);
    } catch {
      setAlert?.("Failed to generate and send share access", "danger");
    } finally {
      setIsSending(false);
    }
  }, [
    expiresInMinutes,
    receiverId,
    router,
    selectedContact?.name,
    selectedContactId,
    setAlert,
    user?._id,
  ]);

  const handleGenerateClick = useCallback(() => {
    void generateAndSend();
  }, [generateAndSend]);

  if (!mounted) return null;

  return (
    <div
      className="flex flex-col gap-6 fade-in animate-in slide-in-from-bottom-2 duration-500 w-full pb-96 mb-10"
      style={{ minHeight: '100vh', overflowY: 'auto' }}
      // Increased pb-96 to ensure scrolling is possible and content is not hidden behind the fixed footer
    >
      {/* DEBUG: This container is intentionally tall to test scrolling. Remove minHeight/border after confirming scroll works. */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl" />
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Contact Share Generator
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Pick a contact, choose a receiver, and send a securely encrypted token
          in seconds.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <div className="flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                1
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">
                Select Contact to Share
              </h2>
            </div>

            <Input
              classNames={{
                inputWrapper:
                  "bg-slate-50 border-slate-200 shadow-none rounded-xl px-4 focus-within:border-blue-400 focus-within:bg-white transition-all",
                input: "text-[14px] text-slate-700 placeholder:text-slate-400",
              }}
              placeholder="Search contacts by name or phone..."
              startContent={<i className="fas fa-search text-slate-400 mr-1" />}
              value={contactSearch}
              variant="bordered"
              onChange={(event) => setContactSearch(event.target.value)}
            />

            {selectedContact && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                  <i className="fas fa-check text-[10px]" />
                </div>
                <div>
                  <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider">
                    Selected Contact
                  </p>
                  <p className="text-[14px] font-semibold text-green-900">
                    {selectedContact.name}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 focus-within:ring-2 ring-blue-100 transition-all">
              {filteredContacts.map((item) => {
                const selected = String(item._id) === selectedContactId;

                return (
                  <button
                    key={item._id}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${selected ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"}`}
                    type="button"
                    onClick={() => setSelectedContactId(String(item._id))}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 transition-colors ${selected ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}
                    >
                      {(item.name?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[14px] font-semibold truncate ${selected ? "text-blue-900" : "text-slate-800"}`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-[12px] truncate ${selected ? "text-blue-700/80" : "text-slate-500"}`}
                      >
                        {item.phone || "No phone number"}
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredContacts.length === 0 && (
                <div className="py-8 text-center bg-white rounded-lg border border-slate-100 border-dashed">
                  <p className="text-[13px] text-slate-400 font-medium">
                    No contacts match your search.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                2
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">
                Select Receiver
              </h2>
            </div>

            {recentReceivers.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Recent Chats
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentReceivers.map((item) => {
                    const selected = item.id === receiverId;

                    return (
                      <button
                        key={`recent-${item.id}`}
                        className={`p-3 rounded-xl border text-left transition-all ${selected ? "bg-violet-50 border-violet-200 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-slate-200 hover:shadow-sm"}`}
                        type="button"
                        onClick={() => setReceiverId(item.id)}
                      >
                        <p
                          className={`text-[13px] font-semibold truncate ${selected ? "text-violet-900" : "text-slate-700"}`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${selected ? "text-violet-700/70" : "text-slate-400"}`}
                        >
                          {item.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                All Users
              </p>
              <Input
                classNames={{
                  inputWrapper:
                    "bg-slate-50 border-slate-200 shadow-none rounded-xl px-4 focus-within:border-violet-400 focus-within:bg-white transition-all mb-2",
                  input:
                    "text-[14px] text-slate-700 placeholder:text-slate-400",
                }}
                placeholder="Search all connected users..."
                startContent={
                  <i className="fas fa-search text-slate-400 mr-1" />
                }
                value={receiverSearch}
                variant="bordered"
                onChange={(event) => setReceiverSearch(event.target.value)}
              />

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 focus-within:ring-2 ring-violet-100 transition-all">
                {filteredReceivers.map((item) => {
                  const selected = item.id === receiverId;

                  return (
                    <button
                      key={`all-${item.id}`}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${selected ? "bg-violet-50 border-violet-200 shadow-sm" : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"}`}
                      type="button"
                      onClick={() => setReceiverId(item.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[14px] font-semibold truncate ${selected ? "text-violet-900" : "text-slate-800"}`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-[12px] truncate ${selected ? "text-violet-700/80" : "text-slate-500"}`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {filteredReceivers.length === 0 && (
                  <div className="py-6 text-center bg-white rounded-lg border border-slate-100 border-dashed">
                    <p className="text-[13px] text-slate-400 font-medium">
                      No users match your criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedReceiver &&
              !recentReceivers.find((r) => r.id === selectedReceiver.id) && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <i className="fas fa-paper-plane text-[10px]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                      Sending To
                    </p>
                    <p className="text-[14px] font-semibold text-indigo-900">
                      {selectedReceiver.name}
                    </p>
                  </div>
                </div>
              )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                3
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">
                Security & Expiry
              </h2>
            </div>

            <p className="text-[13px] text-slate-500 mb-2">
              To protect sensitive data, all shared contacts are protected with
              secure expiring links. How long should this token remain active?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
              {[
                { key: "5m", label: "5 Minutes", icon: "fa-bolt" },
                { key: "10m", label: "10 Minutes", icon: "fa-stopwatch" },
                { key: "1h", label: "1 Hour", icon: "fa-hourglass-half" },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`relative p-4 rounded-xl border text-center transition-all duration-300 flex flex-col items-center gap-2 ${expiryPreset === item.key ? "bg-amber-50 border-amber-300 shadow-sm ring-1 ring-amber-300" : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100"}`}
                  type="button"
                  onClick={() => setExpiryPreset(item.key as ExpiryPreset)}
                >
                  <i
                    className={`fas ${item.icon} ${expiryPreset === item.key ? "text-amber-500" : "text-slate-400"} text-lg`}
                  />
                  <span
                    className={`text-[13px] font-bold ${expiryPreset === item.key ? "text-amber-700" : "text-slate-600"}`}
                  >
                    {item.label}
                  </span>
                  {expiryPreset === item.key && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                      <i className="fas fa-check text-[8px] text-white" />
                    </div>
                  )}
                </button>
              ))}
              <div
                className={`relative p-4 rounded-xl border text-center flex flex-col items-center gap-2 min-w-[120px] ${expiryPreset === "custom" ? "bg-amber-50 border-amber-300 shadow-sm ring-1 ring-amber-300" : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100"}`}
                style={{ cursor: "pointer" }}
                onClick={() => setExpiryPreset("custom" as ExpiryPreset)}
              >
                <i
                  className={`fas fa-clock ${expiryPreset === "custom" ? "text-amber-500" : "text-slate-400"} text-lg`}
                />
                {expiryPreset === "custom" ? (
                  <input
                    className="w-20 min-w-[60px] text-center text-[15px] font-bold bg-white border border-amber-300 rounded-md outline-none text-amber-700 py-1 mt-1 mb-1"
                    min={1}
                    placeholder="Custom"
                    type="number"
                    value={customExpiry}
                    onChange={(e) => {
                      setCustomExpiry(e.target.value);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                ) : (
                  <span className="text-[15px] font-bold text-amber-400">
                    Custom
                  </span>
                )}
                <span className="text-[11px] text-slate-500">min</span>
                {expiryPreset === "custom" && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                    <i className="fas fa-check text-[8px] text-white" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col gap-5 text-white overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />

            <h2 className="text-[15px] font-bold text-slate-100 border-b border-white/10 pb-3 flex items-center gap-2">
              <i className="fas fa-microchip text-indigo-400" /> Secure
              Transport Preview
            </h2>

            <div className="space-y-4 relative z-10">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                  Encrypted Payload
                </span>
                <span className="text-[15px] font-semibold text-white bg-white/5 rounded-lg px-3 py-2 border border-white/10 flex items-center gap-2">
                  <i className="fas fa-user-lock text-emerald-400" />
                  {selectedContact?.name || (
                    <span className="text-slate-500 font-normal italic">
                      No contact selected
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-center py-1">
                <div className="w-px h-6 bg-gradient-to-b from-white/10 to-indigo-500/50" />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                  Authenticated Destination
                </span>
                <span className="text-[15px] font-semibold text-white bg-white/5 rounded-lg px-3 py-2 border border-white/10 flex items-center gap-2">
                  <i className="fas fa-location-arrow text-indigo-400" />
                  {selectedReceiver?.name || (
                    <span className="text-slate-500 font-normal italic">
                      No receiver selected
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-2">
              <div className="flex items-start gap-3">
                <i className="fas fa-shield-halved text-amber-400 mt-0.5" />
                <div>
                  <p className="text-[13px] text-amber-200 font-semibold selection:bg-amber-500/30">
                    Auto-Destruct Protocol
                  </p>
                  <p className="text-[11px] text-amber-100/60 mt-1 leading-relaxed">
                    Token completely invalidates in{" "}
                    <span className="text-amber-300 font-bold">
                      {expiresInMinutes} minutes
                    </span>{" "}
                    {expiresAt &&
                      `at precisely ${new Date(expiresAt).toLocaleTimeString()}`}
                    . Cannot be intercepted.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center items-end w-full pointer-events-none">
        <div className="bg-gradient-to-br from-[#e0fff7] via-[#e6e6ff] to-[#ffe6fa] border border-[#c6d0f7] rounded-2xl shadow-[0_0_18px_2px_rgba(110,110,255,0.10)] px-8 py-6 flex flex-row gap-6 max-w-xl w-full mb-8 pointer-events-auto items-center justify-center">
          <Button
            className="bg-white border border-[#aafbe7] text-[#3bc9a7] font-semibold px-8 py-4 h-16 rounded-xl shadow-[0_0_8px_1px_#aafbe7] hover:bg-[#e0fff7] hover:border-[#3bc9a7] transition-all box-border min-w-[140px] text-lg tracking-wide"
            style={{ boxShadow: "0 2px 8px 1px #aafbe7" }}
            variant="flat"
            onClick={() => router.push("/")}
            onPress={() => router.push("/")}
          >
            <span className="flex items-center gap-2">
              <i className="fas fa-times-circle text-[#3bc9a7] drop-shadow-[0_0_2px_#aafbe7]" />{" "}
              Cancel Flow
            </span>
          </Button>
          <Button
            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-8 py-4 h-16 rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.5)] hover:from-indigo-600 hover:to-violet-600 transition-all box-border min-w-[160px] text-lg tracking-wide"
            isDisabled={!selectedContactId || !receiverId || isSending}
            onClick={handleGenerateClick}
            onPress={handleGenerateClick}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <i className="fas fa-spinner fa-spin" />{" "}
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className="fas fa-paper-plane" />{" "}
                Send
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareGeneratorPage;
