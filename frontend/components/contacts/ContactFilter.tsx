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
        <form onSubmit={(e) => e.preventDefault()} className="mb-4">
            <Input
                ref={text}
                placeholder="Filter Contacts..."
                onChange={onChange}
                variant="bordered"
                startContent={<i className="fas fa-search text-default-400" />}
            />
        </form>
    );
};

export default ContactFilter;
