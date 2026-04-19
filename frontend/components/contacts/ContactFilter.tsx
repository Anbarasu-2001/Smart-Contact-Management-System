"use client";

import React, { useContext, useRef, useEffect } from "react";
import { Input } from "@heroui/input";

import { ContactContext } from "../../context/contact/ContactContext";

const ContactFilter = () => {
  const contactContext = useContext(ContactContext);
  const text = useRef<HTMLInputElement>(null);

  const { filterContacts, clearFilter, filtered } = contactContext || {};

  useEffect(() => {
    if (filtered === null && text.current) {
      text.current.value = "";
    }
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (text.current && text.current.value !== "") {
      if (filterContacts) filterContacts(e.target.value);
    } else {
      if (clearFilter) clearFilter();
    }
  };

  return (
    <form
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-inner"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-[13px] font-semibold text-slate-700 tracking-wide uppercase">
          Smart Search
        </p>
        <p className="text-[11px] text-slate-400 font-medium">
          Find by name or phone
        </p>
      </div>
      <Input
        ref={text}
        classNames={{
          inputWrapper:
            "bg-white border-slate-300 shadow-sm rounded-xl px-4 group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all",
          input: "text-[14px] font-medium placeholder:text-slate-400",
        }}
        placeholder="Filter Contacts..."
        startContent={<i className="fas fa-search text-indigo-500" />}
        variant="bordered"
        onChange={onChange}
      />
    </form>
  );
};

export default ContactFilter;
