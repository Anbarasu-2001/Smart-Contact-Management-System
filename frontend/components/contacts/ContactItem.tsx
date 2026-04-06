'use client';

import React, { useContext } from 'react';
import { ContactContext, Contact } from '../../context/contact/ContactContext';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Pencil, Trash2, MessageCircle, Phone, Video } from 'lucide-react';
import AppAvatar from '../design/AppAvatar';
import StatusBadge from '../design/StatusBadge';
import ListItem from '../design/ListItem';

interface ContactItemProps {
    contact: Contact;
    onOpenChat?: (contact: Contact) => void;
    onVoiceCall?: (contact: Contact) => void;
    onVideoCall?: (contact: Contact) => void;
    onEdit?: (contact: Contact) => void;
    onDelete?: (contact: Contact) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, onOpenChat, onVoiceCall, onVideoCall, onEdit, onDelete }) => {
    const contactContext = useContext(ContactContext);
    const { setCurrent } = contactContext || {};
    const router = useRouter();

    const { _id, name, phone } = contact;
    const canCommunicate = Boolean(contact.userId || contact.linkedUserId);
    const onChat = () => {
        if (!canCommunicate) {
            return;
        }
        if (onOpenChat) {
            onOpenChat(contact);
            return;
        }
        if (setCurrent) setCurrent(contact);
        console.log("Clicked Contact:", contact);
        router.push(`/chat/${contact._id}?name=${contact.name}`);
    };

    const onCall = () => {
        if (!canCommunicate) {
            return;
        }
        if (onVoiceCall) {
            onVoiceCall(contact);
            return;
        }
        if (setCurrent) setCurrent(contact);
        router.push(`/call/${_id}`);
    };

    const onVideo = () => {
        if (!canCommunicate) {
            return;
        }
        if (onVideoCall) {
            onVideoCall(contact);
            return;
        }
        if (setCurrent) setCurrent(contact);
        router.push('/');
    };

    const openDetails = () => {
        if (!_id) return;
        if (setCurrent) setCurrent(contact);
        router.push(`/contact/${_id}`);
    };

    return (
        <ListItem
            role="button"
            tabIndex={0}
            onClick={openDetails}
            onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openDetails();
            }}
            className="contact-premium-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
        >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <AppAvatar name={name || '?'} className="shrink-0 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105" />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-100 truncate text-[15px] tracking-tight">{name}</h4>
                        {canCommunicate && <StatusBadge label="LIVE" className="!h-4 !text-[10px]" />}
                    </div>
                    <p className="text-sm text-slate-300/90 truncate">{phone}</p>
                    {!canCommunicate && (
                        <p className="text-[11px] font-medium text-amber-200 truncate bg-amber-500/20 px-2 py-0.5 rounded-full inline-block border border-amber-300/30">App Not Installed</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 opacity-95 group-hover:opacity-100 transition-opacity self-end sm:self-auto rounded-full border border-cyan-300/15 bg-slate-900/70 backdrop-blur-md px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
                <Button size="sm" variant="light" className="text-slate-200 hover:bg-slate-700/50 border border-slate-600/30 rounded-full" onPress={() => onEdit?.(contact)} aria-label="Edit contact">
                    <Pencil size={14} className="mr-1" /> Edit
                </Button>
                <Button isIconOnly size="sm" variant="light" className="text-rose-300 hover:bg-rose-500/15 border border-rose-300/20 rounded-full" onPress={() => onDelete?.(contact)} aria-label="Delete contact">
                    <Trash2 size={16} />
                </Button>
                <div className="w-px h-5 bg-slate-600/60" />
                <Button isIconOnly size="sm" variant="flat" className="!w-9 !h-9 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 transition-all duration-300 hover:scale-105 rounded-full" onPress={onChat} aria-label="Chat" isDisabled={!canCommunicate}>
                    <MessageCircle size={16} />
                </Button>
                <Button isIconOnly size="sm" variant="flat" className="!w-9 !h-9 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 transition-all duration-300 hover:scale-105 rounded-full" onPress={onCall} aria-label="Voice call" isDisabled={!canCommunicate}>
                    <Phone size={16} />
                </Button>
                <Button isIconOnly size="sm" variant="flat" className="!w-9 !h-9 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-all duration-300 hover:scale-105 rounded-full" onPress={onVideo} aria-label="Video call" isDisabled={!canCommunicate}>
                    <Video size={16} />
                </Button>
            </div>
        </ListItem>
    );
};

export default ContactItem;
