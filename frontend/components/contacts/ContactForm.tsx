"use client";

import React, { useState, useContext, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";

import { AlertContext } from "../../context/alert/AlertContext";
import { ContactContext, Contact } from "../../context/contact/ContactContext";

interface ContactFormProps {
  onSaved?: () => void;
  onCancel?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSaved, onCancel }) => {
  const contactContext = useContext(ContactContext);
  const alertContext = useContext(AlertContext);

  const { addContact, updateContact, clearCurrent, current, error } =
    contactContext || {};
  const { setAlert } = alertContext || {};

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    relationshipType: "friend" as "friend" | "family" | "work",
    notes: "",
    type: "personal" as "personal" | "professional",
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const relationshipOptions = [
    { key: "friend", label: "Friend", icon: "fa-user-group" },
    { key: "family", label: "Family", icon: "fa-house-user" },
    { key: "work", label: "Work", icon: "fa-briefcase" },
  ] as const;

  const normalizeRelationshipForForm = (value?: string) => {
    const normalized = String(value || "").toLowerCase();

    if (normalized === "family") return "family";
    if (
      normalized === "work" ||
      normalized === "colleague" ||
      normalized === "client"
    )
      return "work";

    return "friend";
  };

  useEffect(() => {
    if (current) {
      setContact({
        name: current.name || "",
        email: current.email || "",
        phone: current.phone || "",
        relationshipType: normalizeRelationshipForForm(
          current.relationshipType || current.relationship,
        ) as any,
        notes: current.notes || "",
        type: current.type || "personal",
      });
    } else {
      setContact({
        name: "",
        email: "",
        phone: "",
        relationshipType: "friend",
        notes: "",
        type: "personal",
      });
    }
    setFormError("");
  }, [current]);

  useEffect(() => {
    if (error && setAlert) {
      setAlert(error, "danger");
    }
  }, [error, setAlert]);

  const { name, email, phone } = contact;

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setContact({ ...contact, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setFormError("Name and phone are required.");

      return;
    }

    setFormError("");
    setIsSaving(true);

    const payload: Contact = {
      ...(current?._id ? { _id: current._id } : {}),
      name: trimmedName,
      phone: trimmedPhone,
      email: email.trim().toLowerCase(),
      relationshipType: contact.relationshipType as any,
      relationship:
        contact.relationshipType === "family"
          ? "Family"
          : contact.relationshipType === "work"
            ? "Work"
            : "Friend",
      notes: contact.notes.trim(),
      type: current?.type || "personal",
    };

    let saved: Contact | null = null;

    if (current?._id && updateContact) {
      saved = await updateContact(payload);
    } else {
      saved = addContact ? await addContact(payload) : null;
    }

    setIsSaving(false);

    if (!saved) return;

    setAlert?.(current ? "✅ Contact updated" : "✅ Contact Added", "success");
    clearAll();
    onSaved?.();
  };

  const clearAll = () => {
    if (clearCurrent) clearCurrent();
    setContact({
      name: "",
      email: "",
      phone: "",
      relationshipType: "friend",
      notes: "",
      type: "personal",
    });
    setFormError("");
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="border-b border-slate-200  pb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600  ">
          {current ? "Edit Contact" : "Add Contact"}
        </h2>
        <p className="text-sm font-medium text-gray-500 ">
          Save contacts for chat and call instantly.
        </p>
      </div>

      {formError && (
        <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50   px-4 py-3 text-sm font-medium text-rose-600  flex items-center gap-2">
          <i className="fas fa-exclamation-circle" />
          <p>{formError}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Input
          required
          classNames={{
            inputWrapper: " ",
          }}
          label="Name"
          name="name"
          placeholder="Enter full name"
          value={name}
          variant="faded"
          onChange={onChange}
        />
        <Input
          required
          classNames={{
            inputWrapper: " ",
          }}
          label="Phone Number"
          name="phone"
          placeholder="Enter active phone number"
          value={phone}
          variant="faded"
          onChange={onChange}
        />
        <Input
          classNames={{
            inputWrapper: " ",
          }}
          label="Email"
          name="email"
          placeholder="Used for app linking"
          type="email"
          value={email}
          variant="faded"
          onChange={onChange}
        />

        <div className="pt-1">
          <p className="text-sm font-medium text-gray-700 ">
            Relationship Label
          </p>
          <div className="grid grid-cols-3 gap-3">
            {relationshipOptions.map((option) => {
              const isSelected = contact.relationshipType === option.key;

              return (
                <button
                  key={option.key}
                  className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-base font-semibold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 min-w-[100px] shadow-md
                                        ${
                                          isSelected
                                            ? "border-[#b46cff] bg-gradient-to-br from-[#e0fff7] via-[#e6e6ff] to-[#ffe6fa] text-[#b46cff] shadow-[0_0_12px_2px_#b46cff33] scale-105"
                                            : "border-slate-200 bg-white text-gray-500 hover:border-[#b46cff] hover:bg-[#f5eaff] hover:text-[#b46cff]"
                                        }
                                    `}
                  type="button"
                  onClick={() =>
                    setContact({
                      ...contact,
                      relationshipType: option.key as any,
                    })
                  }
                >
                  <i
                    className={`fas ${option.icon} ${isSelected ? "scale-110 text-[#b46cff] drop-shadow-[0_0_4px_#b46cff99]" : "opacity-80 text-gray-400"} transition-transform`}
                  />
                  <span>{option.label}</span>
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#b46cff22] pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-1">
          <Textarea
            classNames={{
              inputWrapper: " ",
            }}
            label="Notes"
            minRows={3}
            name="notes"
            placeholder="Add some notes about this contact..."
            value={contact.notes}
            variant="faded"
            onChange={onChange}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 ">
        <Button
          className="font-medium text-gray-600 "
          type="button"
          variant="light"
          onPress={() => {
            clearAll();
            setFormError("");
            onCancel?.();
          }}
        >
          Cancel
        </Button>
        <Button
          className="font-semibold bg-gradient-to-r from-[#aafbe7] via-[#b46cff] to-[#ffe6fa] text-[#181c2f] shadow-[0_0_16px_2px_#b46cff33] border-2 border-[#b46cff] rounded-xl px-8 py-3 transition-all duration-300 hover:shadow-[0_0_24px_4px_#b46cff55] hover:-translate-y-1 hover:scale-[1.03]"
          isLoading={isSaving}
          type="submit"
        >
          {current ? "Save Changes" : "Save Contact"}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
