"use client";

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Pencil, Trash2, MessageCircle, Phone, Video } from "lucide-react";

import { ContactContext, Contact } from "../../context/contact/ContactContext";
import AppAvatar from "../design/AppAvatar";
import StatusBadge from "../design/StatusBadge";

interface ContactItemProps {
  contact: Contact;
  onOpenChat?: (contact: Contact) => void;
  onVoiceCall?: (contact: Contact) => void;
  onVideoCall?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  onOpenChat,
  onVoiceCall,
  onVideoCall,
  onEdit,
  onDelete,
}) => {
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
    router.push(`/call/${_id}?type=audio`);
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
    router.push(`/call/${_id}?type=video`);
  };

  const openDetails = () => {
    if (!_id) return;
    if (setCurrent) setCurrent(contact);
    router.push(`/contact/${_id}`);
  };

  return (
    <div
      className="contact-premium-card rounded-[1.25rem] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer w-full"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openDetails();
      }}
    >
      <div className="flex items-center gap-4 min-w-[200px] flex-1">
        <AppAvatar
          className="shrink-0 w-12 h-12 text-blue-600 bg-blue-100/50 shadow-sm transition-all duration-300 group-hover:scale-105"
          name={name || "?"}
        />
        <div className="min-w-0 space-y-1 max-w-[calc(100%-80px)]">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-800 text-[15px] break-words line-clamp-1">
              {name}
            </h4>
            {canCommunicate && (
              <StatusBadge
                className="!h-5 !text-[10px] !bg-green-100 !text-green-700 !border-green-200 shrink-0"
                label="LIVE"
              />
            )}
          </div>
          <p className="text-[13px] text-slate-500 truncate w-full">{phone}</p>
          {!canCommunicate && (
            <p className="text-[11px] font-medium text-amber-700 truncate bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/50">
              App Not Installed
            </p>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto sm:opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          aria-label="Edit contact"
          className="h-8 bg-slate-100/50 text-slate-600 hover:bg-slate-200/50 font-medium rounded-lg"
          size="sm"
          variant="flat"
          onPress={() => onEdit?.(contact)}
        >
          <Pencil className="mr-1.5" size={14} /> Edit
        </Button>
        <Button
          isIconOnly
          aria-label="Delete contact"
          className="w-8 h-8 min-w-8 bg-slate-100/50 text-red-500 hover:bg-red-100/80 rounded-lg"
          size="sm"
          variant="flat"
          onPress={() => onDelete?.(contact)}
        >
          <Trash2 size={15} />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          isIconOnly
          aria-label="Chat"
          className="w-8 h-8 min-w-8 !rounded-lg"
          color="primary"
          isDisabled={!canCommunicate}
          size="sm"
          variant="shadow"
          onPress={onChat}
        >
          <MessageCircle size={15} />
        </Button>
        <Button
          isIconOnly
          aria-label="Voice call"
          className="w-8 h-8 min-w-8 !bg-violet-500 !text-white !rounded-lg"
          color="secondary"
          isDisabled={!canCommunicate}
          size="sm"
          variant="shadow"
          onPress={onCall}
        >
          <Phone size={15} />
        </Button>
        <Button
          isIconOnly
          aria-label="Video call"
          className="w-8 h-8 min-w-8 !bg-cyan-500 !text-white !rounded-lg"
          color="primary"
          isDisabled={!canCommunicate}
          size="sm"
          variant="shadow"
          onPress={onVideo}
        >
          <Video size={15} />
        </Button>
      </div>
    </div>
  );
};

export default ContactItem;
