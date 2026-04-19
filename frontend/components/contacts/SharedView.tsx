"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import api from "../../utils/api";

const SharedView = () => {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [contact, setContact] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<"idle" | "loading" | "expired" | "used" | "invalid">("idle");

  useEffect(() => {
    const fetchSharedContact = async () => {
      try {
        const res = await api.get(`/share/${token}`);
        setContact(res.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response ? err.response.data.msg : "Server Error or Expired Link");
        setLoading(false);
      }
    };
    if (token) fetchSharedContact();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }
  if (error) {
    return <div className="flex justify-center text-red-500">{error}</div>;
  }

  const now = new Date();
  const expiresAt = contact?.expiresAt ? new Date(contact.expiresAt) : null;
  let expired = false;
  if (!expiresAt) {
    expired = true;
  } else {
    expired =
      contact?.status === "expired" ||
      !contact?.isActive ||
      actionState === "expired" ||
      expiresAt <= now;
  }
  const disabled =
    actionState === "loading" ||
    expired ||
    actionState === "used" ||
    actionState === "invalid";

  const consumeAccess = async (action: "call" | "chat") => {
    if (!token || !contact) return;
    setActionState("loading");
    try {
      const res = await api.post(`/share/${token}/access`, { action });
      if (res?.data?.status === "expired") {
        setActionState("expired");
        return;
      }
      if (!res?.data?.isActive && res?.data?.isOneTime) {
        setActionState("used");
        return;
      } else {
        setActionState("idle");
      }
      const contactId = res?.data?.contactId || contact?.contactId;
      if (action === "chat" && contactId) {
        router.push(`/chat/${contactId}`);
      } else if (action === "call" && contactId) {
        router.push(`/call/${contactId}?autoCall=1`);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const statusCode = err?.response?.status;
      if (statusCode === 410) {
        setActionState("expired");
      } else {
        setActionState("invalid");
      }
    }
  };

  if (expired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-wrap gap-4 p-8 bg-white/70 rounded-2xl shadow-xl border border-white/50">
          <div className="text-danger-600 font-semibold">
            { !expiresAt
              ? "Expiry time missing. Please regenerate the link."
              : "This link has expired." }
          </div>
          <div className="text-xs text-gray-500">
            {expiresAt && `Expired at: ${expiresAt.toLocaleString()}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-between">
          <h1 className="text-2xl font-bold text-primary">{contact?.name}</h1>
          <Chip color="primary">Limited Access</Chip>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="flex items-center justify-between text-xs">
            <Chip
              color={
                expired
                  ? "danger"
                  : contact?.status === "viewed"
                    ? "primary"
                    : "success"
              }
            >
              {expired ? "Expired" : contact?.status === "viewed" ? "Viewed" : "Active"}
            </Chip>
            <span className="text-default-500">Expires: {expiresAt && expiresAt > now ? expiresAt.toLocaleString() : "Unknown"}</span>
          </div>
          <p className="text-sm text-gray-500">
            Only secure actions are allowed for this shared contact. Sensitive details remain hidden.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-cyan-500/90 text-gray-800"
              isDisabled={disabled}
              onPress={() => void consumeAccess("call")}
            >
              Secure Call
            </Button>
            <Button
              className="glass-action"
              isDisabled={disabled}
              onPress={() => void consumeAccess("chat")}
            >
              Secure Chat
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SharedView;
