'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Button } from '@heroui/button';

type SharedContactView = {
    contactId: string;
    name: string;
    expiresAt: string;
    isOneTime: boolean;
    isActive: boolean;
    accessType: 'limited';
    status: 'active' | 'viewed' | 'expired';
};

const SharedView = () => {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;

    const [contact, setContact] = useState<SharedContactView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionState, setActionState] = useState<'idle' | 'loading' | 'expired' | 'used' | 'invalid'>('idle');

    const getHeaders = () => {
        const authToken = localStorage.getItem('token');
        return {
            'x-auth-token': authToken || '',
            Authorization: authToken ? `Bearer ${authToken}` : '',
        };
    };

    const isExpired = error?.toLowerCase().includes('expired');
    const isInvalid = error?.toLowerCase().includes('invalid');

    useEffect(() => {
        const fetchSharedContact = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/share/${token}`, {
                    headers: getHeaders(),
                });
                setContact(res.data);
                setLoading(false);
            } catch (err: any) {
                setError(err.response ? err.response.data.msg : 'Server Error or Expired Link');
                setLoading(false);
            }
        };

        if (token) fetchSharedContact();
    }, [token]);

    if (loading) return <div className="flex justify-center"><Spinner size="lg" /></div>;

    if (error) return (
        <div className="flex justify-center">
            <Card className="w-full max-w-md bg-danger-50 text-danger-600 p-4">
                <p className="font-semibold">{isExpired ? 'This link has expired' : isInvalid ? 'Invalid link' : 'Unable to open shared contact'}</p>
                <p className="text-sm">{error}</p>
            </Card>
        </div>
    );

    const consumeAccess = async (action: 'call' | 'chat') => {
        if (!token || !contact) return;
        setActionState('loading');
        try {
            const res = await axios.post(
                `http://localhost:5000/api/share/${token}/access`,
                { action },
                { headers: getHeaders() },
            );

            if (res?.data?.status === 'expired') {
                setActionState('expired');
                return;
            }

            if (!res?.data?.isActive && res?.data?.isOneTime) {
                setActionState('used');
            } else {
                setActionState('idle');
            }

            router.push('/');
        } catch (err: any) {
            const statusCode = err?.response?.status;
            if (statusCode === 410) {
                setActionState('expired');
            } else {
                setActionState('invalid');
            }
        }
    };

    const expired = contact?.status === 'expired' || !contact?.isActive || actionState === 'expired';
    const disabled = actionState === 'loading' || expired || actionState === 'used' || actionState === 'invalid';

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="flex justify-between">
                    <h1 className="text-2xl font-bold text-primary">{contact?.name}</h1>
                    <Chip color="primary">Limited Access</Chip>
                </CardHeader>
                <CardBody className="gap-4">
                    <div className="flex items-center justify-between text-xs">
                        <Chip color={expired ? 'danger' : contact?.status === 'viewed' ? 'primary' : 'success'}>
                            {expired ? 'Expired' : contact?.status === 'viewed' ? 'Viewed' : 'Active'}
                        </Chip>
                        <span className="text-default-500">Expires: {contact?.expiresAt ? new Date(contact.expiresAt).toLocaleString() : '--'}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Only secure actions are allowed for this shared contact. Sensitive details remain hidden.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="bg-cyan-500/90 text-white"
                            isDisabled={disabled}
                            onPress={() => void consumeAccess('call')}
                        >
                            Secure Call
                        </Button>
                        <Button
                            className="glass-action"
                            isDisabled={disabled}
                            onPress={() => void consumeAccess('chat')}
                        >
                            Secure Chat
                        </Button>
                    </div>

                    {actionState === 'used' && <p className="text-sm text-amber-500">One-time access has already been consumed.</p>}
                    {actionState === 'expired' && <p className="text-sm text-rose-500">This share link has expired.</p>}
                    {actionState === 'invalid' && <p className="text-sm text-rose-500">You do not have access to this share link.</p>}
                </CardBody>
            </Card>
        </div>
    );
};

export default SharedView;
