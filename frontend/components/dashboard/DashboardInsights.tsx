'use client';

import React, { useContext, useEffect } from 'react';
import { ContactContext } from '../../context/contact/ContactContext';
import { AuthContext } from '../../context/auth/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';

const DashboardInsights = () => {
    const contactContext = useContext(ContactContext);
    const authContext = useContext(AuthContext);

    const { getDashboardStats, dashboardStats, loading } = contactContext || {};
    const { isAuthenticated } = authContext || {};

    useEffect(() => {
        if (isAuthenticated && getDashboardStats) {
            getDashboardStats();
        }
        // eslint-disable-next-line
    }, [isAuthenticated]);

    if (loading || !dashboardStats) {
        return <div className="text-center text-slate-300">Loading Insights...</div>;
    }

    // Cast because dashboardStats intnerface in Context might be minimal
    const { totalContacts, activeContacts, inactiveContacts, reconnectSuggestions } = dashboardStats as any;

    return (
        <Card className="glass-card">
            <CardHeader className="justify-between pb-0">
                <h2 className="text-xl font-bold neon-title w-full text-center">Dashboard Insights</h2>
            </CardHeader>
            <CardBody>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-cyan-300">{totalContacts}</h3>
                        <p className="text-sm text-slate-300">Total</p>
                    </div>
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-emerald-300">{activeContacts}</h3>
                        <p className="text-sm text-slate-300">Active (30d)</p>
                    </div>
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-rose-300">{inactiveContacts}</h3>
                        <p className="text-sm text-slate-300">Inactive</p>
                    </div>
                </div>

                {reconnectSuggestions && reconnectSuggestions.length > 0 && (
                    <div className="border-t pt-2 border-cyan-400/20">
                        <h4 className="text-md font-semibold">Reconnect Suggestions</h4>
                        <ul className="flex flex-col gap-6">
                            {reconnectSuggestions.map((contact: any) => (
                                <li
                                    key={contact._id}
                                    className="rounded-md p-2 border border-cyan-400/20 text-sm bg-slate-900/30"
                                >
                                    <div className="flex justify-between">
                                        <strong>{contact.name}</strong>
                                        <span className="text-xs text-slate-400">
                                            {contact.priority}
                                        </span>
                                    </div>
                                    <small className="block text-slate-400">
                                        Last interaction: {new Date(contact.updatedAt).toLocaleDateString()}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default DashboardInsights;
