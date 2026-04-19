"use client";

import React, { useContext, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { ContactContext } from "../../context/contact/ContactContext";
import { AuthContext } from "../../context/auth/AuthContext";

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
    return <div className="text-center text-gray-500">Loading Insights...</div>;
  }

  // Cast because dashboardStats intnerface in Context might be minimal
  const {
    totalContacts,
    activeContacts,
    inactiveContacts,
    reconnectSuggestions,
  } = dashboardStats as any;

  return (
    <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
      <CardHeader className="justify-between pb-0">
        <h2 className="text-xl font-bold neon-title w-full text-center">
          Dashboard Insights
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="p-2">
            <h3 className="text-2xl font-bold text-indigo-500">
              {totalContacts}
            </h3>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="p-2">
            <h3 className="text-2xl font-bold text-emerald-300">
              {activeContacts}
            </h3>
            <p className="text-sm text-gray-500">Active (30d)</p>
          </div>
          <div className="p-2">
            <h3 className="text-2xl font-bold text-rose-300">
              {inactiveContacts}
            </h3>
            <p className="text-sm text-gray-500">Inactive</p>
          </div>
        </div>

        {reconnectSuggestions && reconnectSuggestions.length > 0 && (
          <div className="border-t pt-2 border-cyan-400/20">
            <h4 className="text-md font-semibold">Reconnect Suggestions</h4>
            <ul className="flex flex-col gap-6">
              {reconnectSuggestions.map((contact: any) => (
                <li
                  key={contact._id}
                  className="rounded-2xl p-2 border border-cyan-400/20 text-sm "
                >
                  <div className="flex justify-between">
                    <strong>{contact.name}</strong>
                    <span className="text-xs text-gray-500">
                      {contact.priority}
                    </span>
                  </div>
                  <small className="block text-gray-500">
                    Last interaction:{" "}
                    {new Date(contact.updatedAt).toLocaleDateString()}
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
