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
        return <div className="text-center my-4 text-gray-400">Loading Insights...</div>;
    }

    // Cast because dashboardStats intnerface in Context might be minimal
    const { totalContacts, activeContacts, inactiveContacts, reconnectSuggestions } = dashboardStats as any;

    return (
        <Card className="bg-default-50 mb-6">
            <CardHeader className="justify-between pb-0">
                <h2 className="text-xl font-bold text-primary w-full text-center">Dashboard Insights</h2>
            </CardHeader>
            <CardBody>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-primary">{totalContacts}</h3>
                        <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-success">{activeContacts}</h3>
                        <p className="text-sm text-gray-600">Active (30d)</p>
                    </div>
                    <div className="p-2">
                        <h3 className="text-2xl font-bold text-danger">{inactiveContacts}</h3>
                        <p className="text-sm text-gray-600">Inactive</p>
                    </div>
                </div>

                {reconnectSuggestions && reconnectSuggestions.length > 0 && (
                    <div className="mt-4 border-t pt-2 border-gray-200">
                        <h4 className="text-md font-semibold mb-2">Reconnect Suggestions</h4>
                        <ul className="space-y-2">
                            {reconnectSuggestions.map((contact: any) => (
                                <li
                                    key={contact._id}
                                    className="bg-background rounded-md p-2 border border-gray-200 text-sm shadow-sm"
                                >
                                    <div className="flex justify-between">
                                        <strong>{contact.name}</strong>
                                        <span className="text-xs text-gray-500">
                                            {contact.priority}
                                        </span>
                                    </div>
                                    <small className="block text-gray-400">
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
