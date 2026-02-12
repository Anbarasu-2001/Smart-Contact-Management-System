'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

const SharedView = () => {
    const params = useParams();
    const token = params?.token as string;

    const [contact, setContact] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSharedContact = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/share/${token}`);
                setContact(res.data);
                setLoading(false);
            } catch (err: any) {
                setError(err.response ? err.response.data.msg : 'Server Error or Expired Link');
                setLoading(false);
            }
        };

        if (token) fetchSharedContact();
    }, [token]);

    if (loading) return <div className="flex justify-center mt-10"><Spinner size="lg" /></div>;

    if (error) return (
        <div className="flex justify-center mt-10">
            <Card className="bg-danger-50 text-danger-600 p-4">
                <p>{error}</p>
            </Card>
        </div>
    );

    return (
        <div className="flex justify-center mt-10">
            <Card className="w-full max-w-md">
                <CardHeader className="flex justify-between">
                    <h1 className="text-2xl font-bold text-primary">{contact.name}</h1>
                    <Chip color={contact.priority === 'High' ? 'danger' : 'primary'}>{contact.priority}</Chip>
                </CardHeader>
                <CardBody className="gap-4">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-phone opacity-70" />
                        <span>{contact.phone}</span>
                    </div>
                    {contact.purpose && (
                        <div className="flex items-center gap-2">
                            <i className="fas fa-briefcase opacity-70" />
                            <span>{contact.purpose}</span>
                        </div>
                    )}
                    {contact.email && (
                        <div className="flex items-center gap-2">
                            <i className="fas fa-envelope opacity-70" />
                            <span>{contact.email}</span>
                        </div>
                    )}
                    <p className="text-sm text-gray-400 italic mt-4 border-t pt-2">
                        This is a shared contact view. Private details are hidden.
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export default SharedView;
