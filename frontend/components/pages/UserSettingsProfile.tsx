import React, { useContext, useState } from "react";

import { AuthContext } from "../../context/auth/AuthContext";
import { Button } from "../ui/Button";

const UserSettingsProfile = () => {
  const authContext = useContext(AuthContext);
  const { user, logout } = authContext || {};
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (!user) return <div className="p-6 text-gray-500">No user loaded.</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement save logic (API call)
    setEditMode(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white/80 rounded-2xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-2 text-slate-800">User Profile</h2>
      <p className="text-slate-500 mb-6">View and edit your profile details.</p>
      <form className="flex flex-col gap-5" onSubmit={handleSave}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-base bg-white disabled:bg-slate-100 disabled:text-slate-400"
            disabled={!editMode}
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-base bg-white disabled:bg-slate-100 disabled:text-slate-400"
            disabled={!editMode}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-4 mt-2">
          {editMode ? (
            <>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-lg shadow"
                type="submit"
              >
                Save
              </Button>
              <Button
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg"
                type="button"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-lg shadow"
              type="button"
              onClick={() => setEditMode(true)}
            >
              Edit
            </Button>
          )}
          <Button
            className="ml-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-2 rounded-lg shadow"
            type="button"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserSettingsProfile;
