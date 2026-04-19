"use client";

import React, { useState, useEffect, useContext } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";

import { AuthContext } from "@/context/auth/AuthContext";
import api from "@/utils/api";
import toast from "react-hot-toast";

interface Reminder {
  _id: string;
  message: string;
  remindAt: string;
  isActive: boolean;
  contactId?: any;
}

interface AIReminder {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function RemindersPage() {
  const authContext = useContext(AuthContext);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [aiReminders, setAiReminders] = useState<AIReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual form
  const [message, setMessage] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!authContext?.token) return;
    fetchData();
  }, [authContext?.token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [manRes, aiRes] = await Promise.all([
        api.get("/reminders"),
        api.get("/ai-reminders"),
      ]);

      setReminders(manRes.data);
      setAiReminders(aiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !time) return;

    try {
      const res = await api.post("/reminders", {
        message,
        remindAt: new Date(time).toISOString(), // user selects locally
      });

      setReminders(prev => [...prev, res.data]);
      setMessage("");
      setTime("");
      toast.success("Reminder set successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to create reminder");
    }
  };

  const toggleManual = async (id: string) => {
    try {
      await api.patch(`/reminders/${id}/toggle`, {});
      setReminders((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, isActive: !r.isActive } : r,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      {/* AI Suggestion Panel */}
      <div className="md:w-1/3 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
          <i className="fas fa-robot" /> AI Suggestions
        </h2>
        {aiReminders.length === 0 && (
          <p className="text-gray-500 text-sm">No AI suggestions right now.</p>
        )}
        {aiReminders.map((ai) => (
          <Card
            key={ai._id}
            className="bg-purple-50  border border-purple-200 shadow-lg"
          >
            <CardBody>
              <div className="flex gap-2 items-start">
                <i className="fas fa-magic text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800 ">
                    {ai.message}
                  </p>
                  <span className="text-xs text-gray-500 block">
                    {new Date(ai.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Divider className="hidden md:block" orientation="vertical" />

      {/* Manual Reminders Panel */}
      <div className="md:w-2/3 flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-bell" /> My Reminders
        </h2>

        <Card className="shadow-lg">
          <CardHeader className="font-semibold px-6 pt-5 pb-2">
            Create New Reminder
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
              <Input
                autoFocus
                required
                label="Reminder Title / Message"
                placeholder="e.g. Call client about contract"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Input
                required
                label="Remind Me At"
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <Button className="font-bold w-1/3" color="primary" type="submit">
                Set Reminder
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Existing Reminders */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-600">
            Upcoming ({reminders.filter((r) => r.isActive).length})
          </h3>
          {reminders
            .filter((r) => r.isActive)
            .map((r) => (
              <Card key={r._id} className="border-l-4 border-l-primary">
                <CardBody className="flex flex-row justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-gray-800 ">{r.message}</p>
                    <p className="text-xs text-gray-500">
                      <i className="far fa-clock" />
                      {new Date(r.remindAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => toggleManual(r._id)}
                  >
                    <i className="fas fa-times" />
                  </Button>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
