'use client';

import React, { useContext, useEffect } from 'react';
import { ContactContext } from '../../context/contact/ContactContext';
import { AuthContext } from '../../context/auth/AuthContext';
import ContactItem from './ContactItem';
// import { CSSTransition, TransitionGroup } from 'react-transition-group';

const Contacts = () => {
    const contactContext = useContext(ContactContext);
    const authContext = useContext(AuthContext);

    const { contacts, filtered, getContacts, loading } = contactContext || {};
    const { isAuthenticated } = authContext || {};

    useEffect(() => {
        if (isAuthenticated && getContacts) {
            getContacts();
        }
        // eslint-disable-next-line
    }, [isAuthenticated]);

    if (contacts !== null && contacts !== undefined && contacts.length === 0 && !loading) {
        return <h4 className="text-center text-gray-500 mt-4">Please add a contact</h4>;
    }

    const contactsToDisplay = filtered || contacts;

    return (
        <div className="grid grid-cols-1 gap-4">
            {contactsToDisplay !== undefined && contactsToDisplay !== null && !loading ? (
                contactsToDisplay.map((contact) => (
                    <ContactItem key={contact._id} contact={contact} />
                ))
            ) : (
                <h4 className="text-center mt-4">Loading...</h4>
            )}
        </div>
    );
};

export default Contacts;
