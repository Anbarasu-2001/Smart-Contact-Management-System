'use client';

import React, { useContext } from 'react';
import { AlertContext } from '../../context/alert/AlertContext';
import { Card, CardBody } from '@heroui/card';

const Alerts = () => {
    const alertContext = useContext(AlertContext);
    const { alerts } = alertContext || { alerts: [] };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {alerts.map((alert) => (
                <Card
                    key={alert.id}
                    className={`w-full max-w-[400px] ${alert.type === 'danger' ? 'bg-danger-50 text-danger-600' :
                            alert.type === 'success' ? 'bg-success-50 text-success-600' :
                                'bg-default-50'
                        }`}
                >
                    <CardBody>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-info-circle" />
                            <span>{alert.msg}</span>
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    );
};

export default Alerts;
