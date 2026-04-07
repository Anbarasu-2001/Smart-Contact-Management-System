'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

type SharedLinkItem = {
    _id: string;
    token: string;
    shareLink: string;
    receiverId: string;
    receiverName: string;
    contactName: string;
    createdAt: string;
    expiresAt: string;
    viewed: boolean;
    viewedAt?: string | null;
    isActive: boolean;
    isOneTime: boolean;
    accessType: 'limited';
    status: 'active' | 'viewed' | 'expired';
};

const statusMeta: Record<SharedLinkItem['status'], { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' },
    viewed: { label: 'Viewed', className: 'bg-sky-500/20 text-sky-300 border border-sky-400/40' },
    expired: { label: 'Expired', className: 'bg-rose-500/20 text-rose-300 border border-rose-400/40' },
};

const MySharedLinks = () => {
    const [items, setItems] = useState<SharedLinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyToken, setBusyToken] = useState<string | null>(null);



    const loadLinks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/share/mine');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err?.response?.data?.msg || 'Unable to load shared links');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLinks();
    }, [loadLinks]);

    const hasItems = useMemo(() => items.length > 0, [items.length]);

    const onRevoke = async (token: string) => {
        try {
            setBusyToken(token);
            await api.delete(`/share/${token}`);
            await loadLinks();
        } catch {
            setError('Unable to revoke link');
        } finally {
            setBusyToken(null);
        }
    };

    const onExtend = async (token: string, minutes: number) => {
        try {
            setBusyToken(token);
            await api.patch(
                `/share/${token}/extend`,
                { minutes }
            );
            await loadLinks();
        } catch {
            setError('Unable to extend link expiry');
        } finally {
            setBusyToken(null);
        }
    };

    const onToggleOneTime = async (item: SharedLinkItem) => {
        try {
            setBusyToken(item.token);
            await api.patch(
                `/share/${item.token}`,
                { isOneTime: !item.isOneTime }
            );
            await loadLinks();
        } catch {
            setError('Unable to update access mode');
        } finally {
            setBusyToken(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[220px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="glass-panel">
                <CardHeader className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold neon-title">My Shared Links</h3>
                        <p className="text-sm app-muted">Track contact share status, views, and expiry.</p>
                    </div>
                    <Button className="glass-action" onPress={() => void loadLinks()}>Refresh</Button>
                </CardHeader>
                <CardBody className="flex flex-col gap-6">
                    {error && <p className="text-sm text-rose-300">{error}</p>}
                    {!hasItems && <p className="text-sm app-muted">No shared links created yet.</p>}

                    {items.map((item) => {
                        const meta = statusMeta[item.status] || statusMeta.expired;
                        const absoluteLink = `${window.location.origin}${item.shareLink}`;

                        return (
                            <div key={item._id} className="glass-card p-3 flex flex-col gap-6">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold truncate">{item.contactName}</p>
                                    <Chip className={meta.className}>{meta.label}</Chip>
                                </div>

                                <div className="text-xs app-muted grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    <p>Receiver: {item.receiverName || item.receiverId || '--'}</p>
                                    <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                                    <p>Expires: {new Date(item.expiresAt).toLocaleString()}</p>
                                    <p>Viewed: {item.viewed ? 'Yes' : 'No'}</p>
                                    <p>Viewed At: {item.viewedAt ? new Date(item.viewedAt).toLocaleString() : '--'}</p>
                                    <p>Access: {item.accessType}</p>
                                    <p>One Time: {item.isOneTime ? 'Enabled' : 'Disabled'}</p>
                                </div>

                                <p className="text-xs text-cyan-100/90 break-all">{absoluteLink}</p>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="glass-action"
                                        onPress={() => navigator.clipboard.writeText(absoluteLink)}
                                    >
                                        Copy Link
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="glass-action"
                                        onPress={() => window.open(absoluteLink, '_blank', 'noopener,noreferrer')}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="glass-action"
                                        isDisabled={item.status === 'expired' || busyToken === item.token}
                                        onPress={() => void onToggleOneTime(item)}
                                    >
                                        {item.isOneTime ? 'Edit: Disable One-Time' : 'Edit: Enable One-Time'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="glass-action"
                                        isDisabled={item.status === 'expired' || busyToken === item.token}
                                        onPress={() => void onExtend(item.token, 10)}
                                    >
                                        Extend +10m
                                    </Button>
                                    {item.status !== 'expired' && (
                                        <Button
                                            size="sm"
                                            className="bg-rose-500/85 text-white"
                                            isDisabled={busyToken === item.token}
                                            onPress={() => void onRevoke(item.token)}
                                        >
                                            Revoke
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardBody>
            </Card>
        </div>
    );
};

export default MySharedLinks;
