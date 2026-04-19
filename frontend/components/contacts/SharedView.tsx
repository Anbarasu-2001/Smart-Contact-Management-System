"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
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
