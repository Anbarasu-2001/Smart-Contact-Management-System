"use client";
import { useEffect, useState, useContext } from "react";
import { Button } from "@heroui/button";

import api from "@/utils/api";
import { AuthContext } from "@/context/auth/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AppAvatar from "@/components/design/AppAvatar";

import { useParams } from "next/navigation";

export default function UserDashboardPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext || {};

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await api.get(`/auth/user/${userId}`);

        setProfile({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
      } catch {
        // Failed to load user; optionally handle error here
      }
      setLoading(false);
    }
    fetchUser();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/auth/user/${userId}`, profile);
      // Profile updated! Optionally handle success here
      if (user && user._id === userId) loadUser?.();
    } catch {
      // Failed to update profile; optionally handle error here
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <AppLayout sidebar={<Sidebar />} topbar={<Topbar title="User Dashboard" />}>
      <main className="p-6 flex flex-col items-center">
        <div className="glass-panel p-6 max-w-lg w-full flex flex-col gap-6">
          <h2 className="text-2xl font-bold mb-2 text-center">User Profile</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSave}>
            <div className="flex items-center gap-4">
              <AppAvatar className="!w-14 !h-14" name={profile.name || "U"} />
              <input
                required
                className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                placeholder="Name"
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>
            <input
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              placeholder="Email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
            <input
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              placeholder="Phone number"
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-md hover:shadow-lg transition-all rounded-xl h-11 mt-2"
              type="submit"
            >
              Save Changes
            </Button>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
