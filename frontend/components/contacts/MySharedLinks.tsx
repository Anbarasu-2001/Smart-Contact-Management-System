"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import api from "../../utils/api";
import socketService from "../../utils/socketService";

type SharedLinkItem = {
  _id: string;
  token: string;
  shareLink: string;
  receiverId: string;
  receiverName: string;
  contactName: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  viewedAt?: string | null;
  isActive: boolean;
  isOneTime: boolean;
  accessType: "limited";
  status: "active" | "viewed" | "expired";
};

const statusMeta: Record<
  SharedLinkItem["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
  },
  viewed: {
    label: "Viewed",
    className: "bg-sky-500/20 text-sky-300 border border-sky-400/40",
  },
  expired: {
    label: "Expired",
    className: "bg-rose-500/20 text-rose-300 border border-rose-400/40",
  },
};

const MySharedLinks = () => {
  const router = useRouter();
  const [items, setItems] = useState<SharedLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [now, setNow] = useState(new Date());

  const syncWithServer = useCallback((serverTime: string | Date | undefined | null) => {
    if (!serverTime) return;
    const serverDate = new Date(serverTime);
    const offset = serverDate.getTime() - Date.now();
    setTimeOffset(offset);
    setNow(new Date(Date.now() + offset));
    console.log(`[TimeSync] Offset set to ${offset}ms`);
  }, []);

  // Update 'now' periodically to refresh time-based statuses
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date(Date.now() + timeOffset)), 10000); // 10s resolution
    return () => clearInterval(timer);
  }, [timeOffset]);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/share/mine");
      const data = res.data;
      
      if (data && data.links && Array.isArray(data.links)) {
        setItems(data.links);
        if (data.serverTime) syncWithServer(data.serverTime);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Unable to load shared links");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinks();

    // Listen for real-time updates
    socketService.on("shareUpdated", () => {
      console.log("[Socket] Share updated, reloading list...");
      void loadLinks();
    });

    return () => {
      socketService.off("shareUpdated");
    };
  }, [loadLinks]);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  const onRevoke = async (token: string) => {
    try {
      setBusyToken(token);
      await api.delete(`/share/${token}`);
      await loadLinks();
    } catch {
      setError("Unable to revoke link");
    } finally {
      setBusyToken(null);
    }
  };

  const onExtend = async (token: string, minutes: number) => {
    try {
      setBusyToken(token);
      await api.patch(`/share/${token}/extend`, { minutes });
      await loadLinks();
    } catch {
      setError("Unable to extend link expiry");
    } finally {
      setBusyToken(null);
    }
  };

  const onToggleOneTime = async (item: SharedLinkItem) => {
    try {
      setBusyToken(item.token);
      await api.patch(`/share/${item.token}`, { isOneTime: !item.isOneTime });
      await loadLinks();
    } catch {
      setError("Unable to update access mode");
    } finally {
      setBusyToken(null);
    }
  };

  if (loading) {
    return (
      <div className="share-neon-page flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="share-neon-page min-h-screen w-full p-6" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="share-glow-orb share-glow-orb-a" />
        <div className="share-glow-orb share-glow-orb-b" />
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            className="glass-action shadow-[0_0_15px_#3b82f6]"
            onPress={() => router.push("/dashboard")}
          >
            <i className="fas fa-arrow-left mr-2" /> Back
          </Button>
          <Button className="glass-action" onPress={() => void loadLinks()}>
            Refresh
          </Button>
        </div>

        <Card className="glass-panel border border-cyan-200/50 shadow-[0_0_15px_#06b6d4]">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold neon-title">
                My Shared Links
              </h3>
              <p className="text-sm app-muted">
                Track contact share status, views, and expiry.
              </p>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-6">
            {error && <p className="text-sm text-rose-300">{error}</p>}
            {!hasItems && (
              <p className="text-sm app-muted">No shared links created yet.</p>
            )}

            {items.map((item) => {
              const isTimeExpired = new Date(item.expiresAt).getTime() <= now.getTime();
              const currentStatus = (isTimeExpired || !item.isActive) ? "expired" : item.status;
              const meta = statusMeta[currentStatus] || statusMeta.expired;
              const absoluteLink = `${window.location.origin}${item.shareLink}`;

              return (
                <div
                  key={item._id}
                  className={`glass-card p-4 flex flex-col gap-6 ${currentStatus === "active" ? "shadow-[0_0_15px_#06b6d4]" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{item.contactName}</p>
                    <Chip className={meta.className}>{meta.label}</Chip>
                  </div>

                  <div className="text-xs app-muted grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <p>
                      Receiver: {item.receiverName || item.receiverId || "--"}
                    </p>
                    <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                    <p>Expires: {new Date(item.expiresAt).toLocaleString()}</p>
                    <p>Viewed: {item.viewed ? "Yes" : "No"}</p>
                    <p>
                      Viewed At:{" "}
                      {item.viewedAt
                        ? new Date(item.viewedAt).toLocaleString()
                        : "--"}
                    </p>
                    <p>Access: {item.accessType}</p>
                    <p>One Time: {item.isOneTime ? "Enabled" : "Disabled"}</p>
                  </div>

                  <p className="text-xs text-indigo-500/90 break-all">
                    {absoluteLink}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      className="glass-action hover:shadow-[0_0_15px_#3b82f6]"
                      size="sm"
                      onPress={() =>
                        navigator.clipboard.writeText(absoluteLink)
                      }
                    >
                      Copy Link
                    </Button>
                    <Button
                      className="glass-action hover:shadow-[0_0_15px_#a855f7]"
                      size="sm"
                      onPress={() =>
                        window.open(
                          absoluteLink,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      View
                    </Button>
                    <Button
                      className="glass-action"
                      isDisabled={
                        currentStatus === "expired" || busyToken === item.token
                      }
                      size="sm"
                      onPress={() => void onToggleOneTime(item)}
                    >
                      {item.isOneTime
                        ? "Edit: Disable One-Time"
                        : "Edit: Enable One-Time"}
                    </Button>
                    <Button
                      className="glass-action"
                      isDisabled={
                        currentStatus === "expired" || busyToken === item.token
                      }
                      size="sm"
                      onPress={() => void onExtend(item.token, 10)}
                    >
                      Extend +10m
                    </Button>
                    {currentStatus !== "expired" && (
                      <Button
                        className="bg-rose-500/85 text-gray-800"
                        isDisabled={busyToken === item.token}
                        size="sm"
                        onPress={() => void onRevoke(item.token)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default MySharedLinks;
