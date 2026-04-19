"use client";

import React, { useEffect, useState } from "react";
import { fetchVaultItems, addVaultItem } from "./vaultApi";
import api from "../../utils/api";

type VaultItem = {
  _id: string;
  type: string;
  title: string;
  content: string;
  size?: number;
};

function PremiumButton({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-2"
      {...props}
    >
      {children}
    </button>
  );
}

function PremiumCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md">
      {children}
    </div>
  );
}

export default function VaultPage() {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "note" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const handleShare = (item: any) => {
    const url = `${window.location.origin}/vault/shared/${item._id}`;
    navigator.clipboard.writeText(url);
    setShareMsg("Share link copied!");
    setTimeout(() => setShareMsg(""), 2000);
  };
  const handleEdit = (item: VaultItem) => {
    setEditId(item._id);
    setEditForm({ title: item.title, content: item.content });
    setEditError("");
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await api.patch(`/vault/${editId}`, editForm);
      setVaultItems(vaultItems.map(i => i._id === editId ? { ...i, ...editForm } : i));
      setEditId(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.error || "Failed to update item");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchVaultItems()
      .then(setVaultItems)
      .catch((err) => {
        setError(err?.response?.data?.error || err?.message || "Failed to load vault items");
        setVaultItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const newItem = await addVaultItem({ ...form, size: 0 });
      setVaultItems([newItem, ...vaultItems]);
      setShowModal(false);
      setForm({ title: "", content: "", type: "note" });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to add vault item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6">
      <div className="flex flex-col gap-6 fade-in w-full px-0 justify-items-start items-start">
        <div className="glass-panel-strong p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold neon-title">Smart Vault</h3>
            <p className="text-sm app-muted">
              Encrypted-looking workspace for secure notes and attachments.
            </p>
          </div>
          <PremiumButton onClick={() => { alert('Add to Vault button clicked!'); setShowModal(true); }}>
            <i className="fas fa-plus" /> Add to Vault
          </PremiumButton>
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 w-full">{error}
            {error.toLowerCase().includes('token') && (
              <div className="text-xs text-orange-600 bg-orange-100 rounded p-2 mt-2">
                <b>Tip:</b> You must be logged in to use the Vault. Please log in and try again.
              </div>
            )}
          </div>
        )}
        {loading && (
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded mb-2 w-full">Loading vault items...</div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <form onSubmit={handleAdd} className="bg-white rounded-2xl p-8 shadow-xl flex flex-col gap-4 min-w-[320px]">
              <h4 className="font-bold text-lg mb-2">Add to Vault</h4>
              <select className="border rounded p-2" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="note">Note</option>
                <option value="asset">Asset</option>
              </select>
              <input className="border rounded p-2" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="border rounded p-2" placeholder="Content or asset URL" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              {error && <div className="text-red-500 text-sm">{error}
                {error.toLowerCase().includes('token') && (
                  <div className="text-xs text-orange-600 bg-orange-100 rounded p-2 mt-2">
                    <b>Tip:</b> You must be logged in to use the Vault. Please log in and try again.
                  </div>
                )}
              </div>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white" disabled={loading}>{loading ? "Saving..." : "Add"}</button>
              </div>
            </form>
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
          <PremiumCard>
            <p className="text-sm app-muted">Pinned Secure Notes</p>
            <ul className="flex flex-col gap-6">
              {vaultItems.filter(i => i.type === "note").map(i => (
                <li key={i._id} className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                  <i className="fas fa-note-sticky text-indigo-500" /> {i.title}
                  <div className="text-xs mt-1 text-slate-500">{i.content}</div>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs text-blue-500" onClick={() => handleEdit(i)}>Edit</button>
                    <button className="text-xs text-green-500" onClick={() => handleShare(i)}>Share</button>
                  </div>
                </li>
              ))}
            </ul>
          </PremiumCard>
          <PremiumCard>
            <p className="text-sm app-muted">Encrypted Assets</p>
            <ul className="flex flex-col gap-6">
              {vaultItems.filter(i => i.type === "asset").map(i => (
                <li key={i._id} className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
                  <span>
                    <i className="fas fa-file-lines text-violet-300" /> {i.title}
                  </span>
                  <div className="text-xs mt-1 text-slate-500">{i.content}</div>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs text-blue-500" onClick={() => handleEdit(i)}>Edit</button>
                    <button className="text-xs text-green-500" onClick={() => handleShare(i)}>Share</button>
                  </div>
                  {shareMsg && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow z-50">{shareMsg}</div>}
                </li>
              ))}
            </ul>
          </PremiumCard>
        </div>
        {editId && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <form onSubmit={handleEditSave} className="bg-white rounded-2xl p-8 shadow-xl flex flex-col gap-4 min-w-[320px]">
              <h4 className="font-bold text-lg mb-2">Edit Vault Item</h4>
              <input className="border rounded p-2" placeholder="Title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="border rounded p-2" placeholder="Content or asset URL" value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} required />
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setEditId(null)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
