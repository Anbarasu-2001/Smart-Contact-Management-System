"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";

import api from "../../utils/api";

type SharedContactView = {
  contactId: string;
  name: string;
  expiresAt: string;
  isOneTime: boolean;
  isActive: boolean;
  accessType: "limited";
  status: "active" | "viewed" | "expired";
};

const SharedView = () => {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [contact, setContact] = useState<SharedContactView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<
    "idle" | "loading" | "expired" | "used" | "invalid"
  >("idle");

  const isExpired = error?.toLowerCase().includes("expired");
  const isInvalid = error?.toLowerCase().includes("invalid");

  useEffect(() => {
    const fetchSharedContact = async () => {
      try {
        const res = await api.get(`/share/${token}`);
        setContact(res.data);
        setLoading(false);
        // Auto-redirect to call page for real-time call as soon as contact is loaded and active
        if (res.data && res.data.contactId && res.data.isActive) {
          router.replace(`/call/${res.data.contactId}?autoCall=1`);
        }
      } catch (err: any) {
        setError(
          err.response ? err.response.data.msg : "Server Error or Expired Link",
        );
        setLoading(false);
      }
    };

    if (token) fetchSharedContact();
  }, [token, router]);

  if (loading)
    return (
      <div className="flex justify-center">
        <Spinner size="lg" />
      </div>
    );


  if (error)
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-md bg-danger-50 text-danger-600 p-4">
          <p className="font-semibold">
            {isExpired
              ? "This link has expired"
              : isInvalid
                ? "Invalid link"
                : "Unable to open shared contact"}
          </p>
          <p className="text-sm">{error}</p>
        </Card>
      </div>
    );

  // Show only Call/Chat buttons (no details)
  // If expired, show only expired message and disable actions
  const now = new Date();
  const expiresAt = contact?.expiresAt ? new Date(contact.expiresAt) : null;
  // Debug output for expiry logic
  console.log("[DEBUG] SharedView Expiry Check", {
    now: now.toISOString(),
    expiresAt: contact?.expiresAt,
    isActive: contact?.isActive,
    status: contact?.status,
  });
  const isReallyExpired =
          !contact?.isActive ||
          contact?.status === "expired" ||
          !expiresAt || expiresAt <= now;

  if (contact && contact.contactId && !isReallyExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-wrap gap-4 p-8 bg-white/70 rounded-2xl shadow-xl border border-white/50">
          <Button
            className="bg-cyan-500/90 text-gray-800"
            onPress={() => router.replace(`/call/${contact.contactId}?autoCall=1`)}
          >
            Secure Call
          </Button>
          <Button
            className="glass-action"
            onPress={() => router.replace(`/chat/${contact.contactId}`)}
          >
            Secure Chat
          </Button>
        </div>
      </div>
    );
  }

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

      // Redirect to chat or call page for the shared contact
      const contactId = res?.data?.contactId || contact?.contactId;

      if (action === "chat" && contactId) {
        router.push(`/chat/${contactId}`);
      } else if (action === "call" && contactId) {
        // Pass autoCall=1 to trigger real-time call
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

  let expired = false;
  if (!expiresAt) {
    expired = true;
    console.warn("[DEBUG] SharedView: expiresAt missing for contact", contact);
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
            <span className="text-default-500">Expires:{" "}
              {expiresAt && expiresAt > now
                ? expiresAt.toLocaleString()
                : "Unknown"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Only secure actions are allowed for this shared contact. Sensitive
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
                      <span className="text-default-500">Expires:{" "}
                        {expiresAt && expiresAt > now
                          ? expiresAt.toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Only secure actions are allowed for this shared contact. Sensitive
                      details remain hidden.
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
