'use client';

import React, { useContext, useEffect } from 'react';
import Contacts from '../contacts/Contacts';
import ContactForm from '../contacts/ContactForm';
import ContactFilter from '../contacts/ContactFilter';
import DashboardInsights from '../dashboard/DashboardInsights';
import { AuthContext } from '../../context/auth/AuthContext';
import { useRouter } from 'next/navigation';

const Home = () => {
    const authContext = useContext(AuthContext);
    const router = useRouter();

    const { loadUser, loading, isAuthenticated } = authContext || {};

    useEffect(() => {
        if (loadUser) {
            loadUser();
        }
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (!loading && !isAuthenticated) {
        return null; // Or a loading spinner while redirecting
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div>
                <DashboardInsights />
                <ContactForm />
            </div>
            <div>
                <ContactFilter />
                <Contacts />
            </div>
        </div>
    );
};

export default Home;
