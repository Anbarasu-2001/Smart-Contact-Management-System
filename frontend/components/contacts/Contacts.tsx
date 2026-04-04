'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ContactContext, Contact } from '../../context/contact/ContactContext';
import { AuthContext } from '../../context/auth/AuthContext';
import { AlertContext } from '../../context/alert/AlertContext';
import ContactItem from './ContactItem';
import ContactForm from './ContactForm';
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

    const { contacts, filtered, getContacts, loading, setCurrent, clearCurrent, deleteContact } = contactContext || {};
    const { isAuthenticated } = authContext || {};
    const { setAlert } = alertContext || {};
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (isAuthenticated && getContacts) {
            getContacts();
        }
        // eslint-disable-next-line
    }, [isAuthenticated]);

    const visibleContacts = useMemo(() => (filtered ?? contacts ?? []), [filtered, contacts]);
    const totalContacts = contacts?.length ?? 0;
    const activeContacts = (contacts ?? []).filter((c) => Boolean(c?.userId || c?.linkedUserId)).length;



    const handleEdit = (contact: Contact) => {
        if (!setCurrent) return;
        setCurrent(contact);
        setShowEditModal(true);
    };

    const handleDelete = async (contact: Contact) => {
        if (!contact?._id || !deleteContact) return;
        const confirmed = window.confirm('Are you sure?');
        if (!confirmed) return;

        const ok = await deleteContact(contact._id);
        if (ok) {
            setAlert?.('🗑 Contact deleted', 'success');
            return;
        }
        setAlert?.('Delete failed', 'danger');
    };

    if (!loading && visibleContacts.length === 0) {
        return (
            <div className="glass-panel p-6 text-center text-slate-300 mt-4">
                <i className="fas fa-address-book text-2xl text-cyan-300/80 mb-2" />
                <h4 className="font-semibold text-slate-100">No contacts available</h4>
                <p className="text-sm app-muted mt-1">Create your first contact to start messaging and calling in real-time.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="glass-panel-strong p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold neon-title">Your Contact Network</h3>
                    <p className="text-sm app-muted mt-1">Organized, searchable, and ready for instant communication.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="badge-pill">Total {totalContacts}</span>
                    <span className="badge-pill">Live {activeContacts}</span>
                </div>
            </div>

            {!loading ? (
                visibleContacts.map((contact) => (
                    <ContactItem
                        key={String(contact._id || contact.phone || contact.name)}
                        contact={contact}
                        onOpenChat={onOpenChat}
                        onVoiceCall={onVoiceCall}
                        onVideoCall={onVideoCall}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))
            ) : (
                <div className="glass-panel p-5 text-center mt-4 text-slate-300">Loading contacts...</div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-fade-in">
                        <ContactForm
                            onSaved={() => {
                                setShowEditModal(false);
                                clearCurrent?.();
                            }}
                            onCancel={() => {
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
