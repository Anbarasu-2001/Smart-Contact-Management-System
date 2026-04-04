'use client';

import React, { useContext, useRef, useEffect } from 'react';
import { ContactContext } from '../../context/contact/ContactContext';
import { Input } from '@heroui/input';

const ContactFilter = () => {
    const contactContext = useContext(ContactContext);
    const text = useRef<HTMLInputElement>(null);

    const { filterContacts, clearFilter, filtered } = contactContext || {};

    useEffect(() => {
        if (filtered === null && text.current) {
            text.current.value = '';
        }
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (text.current && text.current.value !== '') {
            if (filterContacts) filterContacts(e.target.value);
        } else {
            if (clearFilter) clearFilter();
        }
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="mb-4 glass-panel p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-sm font-medium text-slate-200">Smart Search</p>
                <p className="text-xs app-muted">Find by name, email, or phone</p>
            </div>
            <Input
                ref={text}
                placeholder="Filter Contacts..."
                onChange={onChange}
                variant="bordered"
                classNames={{
                    inputWrapper: 'soft-input border-cyan-300/25 shadow-none rounded-2xl px-2 group-data-[focus=true]:border-cyan-300/60 group-data-[focus=true]:shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_22px_-10px_rgba(34,211,238,0.9)]',
                }}
                startContent={<i className="fas fa-search text-cyan-300" />}
            />
        </form>
    );
};

export default ContactFilter;
