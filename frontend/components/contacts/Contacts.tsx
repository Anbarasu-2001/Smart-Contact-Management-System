"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

import { ContactContext, Contact } from "../../context/contact/ContactContext";
import { AuthContext } from "../../context/auth/AuthContext";
import { AlertContext } from "../../context/alert/AlertContext";

import ContactItem from "./ContactItem";
import ContactForm from "./ContactForm";
// import { CSSTransition, TransitionGroup } from 'react-transition-group';

type ContactActionTarget = {
  _id?: string;
  name: string;
};

interface ContactsProps {
  onOpenChat?: (contact: ContactActionTarget) => void;
  onVoiceCall?: (contact: ContactActionTarget) => void;
  onVideoCall?: (contact: ContactActionTarget) => void;
}

const Contacts = ({ onOpenChat, onVoiceCall, onVideoCall }: ContactsProps) => {
  const contactContext = useContext(ContactContext);
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);

  const {
    contacts,
    filtered,
    getContacts,
    loading,
    setCurrent,
    clearCurrent,
    deleteContact,
  } = contactContext || {};
  const { isAuthenticated } = authContext || {};
  const { setAlert } = alertContext || {};
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && getContacts) {
      getContacts();
    }
    // eslint-disable-next-line
    }, [isAuthenticated]);

  const visibleContacts = useMemo(
    () => filtered ?? contacts ?? [],
    [filtered, contacts],
  );
  const totalContacts = contacts?.length ?? 0;
  const activeContacts = (contacts ?? []).filter((c) =>
    Boolean(c?.userId || c?.linkedUserId),
  ).length;

  const handleEdit = (contact: Contact) => {
    if (!setCurrent) return;
    setCurrent(contact);
    setShowEditModal(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (!contact?._id || !deleteContact) return;
    const confirmed = window.confirm("Are you sure?");

    if (!confirmed) return;

    const ok = await deleteContact(contact._id);

    if (ok) {
      setAlert?.("Contact deleted", "success");

      return;
    }
    setAlert?.("Delete failed", "danger");
  };

  if (!loading && visibleContacts.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-gray-500 flex flex-col items-center justify-center">
        <BookOpen className="w-8 h-8 text-indigo-500/80" />
        <h4 className="font-semibold text-gray-500">No contacts available</h4>
        <p className="text-sm app-muted">
          Create your first contact to start messaging and calling in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">
            Your Contact Network
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Organized, searchable, and ready for instant communication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200/60 text-sm font-medium flex items-center shadow-sm">
            <span className="opacity-70 mr-1.5">Total</span>
            <span className="font-semibold text-slate-900">
              {totalContacts}
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-sm font-medium flex items-center shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="opacity-80 mr-1.5">Live</span>
            <span className="font-semibold text-indigo-900">
              {activeContacts}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {!loading ? (
          visibleContacts.map((contact) => (
            <ContactItem
              key={String(contact._id || contact.phone || contact.name)}
              contact={contact}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onOpenChat={onOpenChat}
              onVideoCall={onVideoCall}
              onVoiceCall={onVoiceCall}
            />
          ))
        ) : (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse flex items-center space-x-2">
              Loading contacts...
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center  backdrop-blur-sm px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[1.5rem] bg-white  border border-slate-200  p-6 shadow-lg animate-fade-in hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <ContactForm
              onCancel={() => {
                setShowEditModal(false);
                clearCurrent?.();
              }}
              onSaved={() => {
                setShowEditModal(false);
                clearCurrent?.();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
