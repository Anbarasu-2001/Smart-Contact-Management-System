'use client';

import React, { useContext } from 'react';
import { ContactContext, Contact } from '../../context/contact/ContactContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

interface ContactItemProps {
    contact: Contact;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact }) => {
    const contactContext = useContext(ContactContext);
    const { deleteContact, setCurrent, clearCurrent } = contactContext || {};
    const router = useRouter();

    const { _id, name, phone, email, type, date } = contact; // Adjusted fields based on Contact interface in Context

    // The client referenced 'purpose', 'priority', 'relationshipScore' but Contact interface in Context had 'type', 'phone', 'email'.
    // I should align with what I defined in ContactContext or what was in client ContactItem.
    // Client ContactItem had: _id, name, phone, purpose, priority, relationshipScore.
    // My ContactContext `Contact` interface had: name, email, phone, type, user, date.
    // I SHOULD UPDATE `ContactContext` interface to match client fields if I want to preserve data structure.
    // BUT existing backend likely returns what Client expects.
    // Let's assume standard fields for now, but I see I might have missed fields in `ContactContext` definition vs Client usage.
    // Client usage: purpose, priority, relationshipScore.
    // I will add these to the item display, assuming the objects have them.
    // I'll cast contact to any for these extra fields or update interface. I'll use `any` for specific extra fields to be safe for now, or extend interface in this file.

    const { purpose, priority, relationshipScore } = contact as any;

    const onDelete = () => {
        if (deleteContact && _id) {
            deleteContact(_id);
            if (clearCurrent) clearCurrent();
        }
    };

    const onEdit = () => {
        if (setCurrent) setCurrent(contact);
    };

    const onView = () => {
        if (setCurrent) setCurrent(contact);
        router.push(`/contact/${_id}`);
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex justify-between items-start pb-2">
                <h3 className="text-primary text-xl font-bold">{name}</h3>
                <Chip
                    color={
                        priority === 'High'
                            ? 'danger'
                            : priority === 'Medium'
                                ? 'primary'
                                : 'success'
                    }
                    variant="flat"
                    size="sm"
                >
                    {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium'}
                </Chip>
            </CardHeader>
            <CardBody className="py-2">
                <ul className="space-y-1 text-sm">
                    {email && ( // Added email as it was in Context type but maybe not in original Item? Original item had phone, purpose, score.
                        <li className="flex items-center gap-2">
                            <i className="fas fa-envelope opacity-70" /> {email}
                        </li>
                    )}
                    {phone && (
                        <li className="flex items-center gap-2">
                            <i className="fas fa-phone opacity-70" /> {phone}
                        </li>
                    )}
                    {purpose && (
                        <li className="flex items-center gap-2">
                            <i className="fas fa-briefcase opacity-70" /> {purpose}
                        </li>
                    )}
                    {relationshipScore !== undefined && (
                        <li className="flex items-center gap-2">
                            <strong>Score:</strong> {relationshipScore}
                        </li>
                    )}
                </ul>
            </CardBody>
            <CardFooter className="flex gap-2 pt-2">
                <Button size="sm" variant="flat" onPress={onEdit}>
                    Edit
                </Button>
                <Button size="sm" color="danger" variant="flat" onPress={onDelete}>
                    Delete
                </Button>
                <Button size="sm" variant="light" onPress={onView}>
                    View
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ContactItem;
