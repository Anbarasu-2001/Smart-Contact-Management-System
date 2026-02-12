'use client';

import React, { useReducer, createContext, ReactNode } from 'react';
import axios from 'axios';
import {
    GET_CONTACTS,
    ADD_CONTACT,
    DELETE_CONTACT,
    SET_CURRENT,
    CLEAR_CURRENT,
    UPDATE_CONTACT,
    FILTER_CONTACTS,
    CLEAR_FILTER,
    CONTACT_ERROR,
    GET_DASHBOARD_STATS,
    DASHBOARD_ERROR,
} from '../types';

// Types
export interface Contact {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    type: 'personal' | 'professional';
    user?: string;
    date?: string;
}

export interface DashboardStats {
    totalContacts: number;
    totalFavorites?: number; // Adjust based on actual API response
    // Add other stats fields
}

interface ContactState {
    contacts: Contact[];
    current: Contact | null;
    filtered: Contact[] | null;
    error: string | null;
    dashboardStats: DashboardStats | null;
    loading: boolean;
}

type ContactAction =
    | { type: typeof GET_CONTACTS; payload: Contact[] }
    | { type: typeof ADD_CONTACT; payload: Contact }
    | { type: typeof DELETE_CONTACT; payload: string }
    | { type: typeof SET_CURRENT; payload: Contact }
    | { type: typeof CLEAR_CURRENT }
    | { type: typeof UPDATE_CONTACT; payload: Contact }
    | { type: typeof FILTER_CONTACTS; payload: string }
    | { type: typeof CLEAR_FILTER }
    | { type: typeof CONTACT_ERROR; payload: string }
    | { type: typeof GET_DASHBOARD_STATS; payload: DashboardStats }
    | { type: typeof DASHBOARD_ERROR; payload: string };

interface ContactContextType extends ContactState {
    getContacts: () => Promise<void>;
    addContact: (contact: Contact) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    setCurrent: (contact: Contact) => void;
    clearCurrent: () => void;
    updateContact: (contact: Contact) => Promise<void>;
    filterContacts: (text: string) => void;
    clearFilter: () => void;
    getDashboardStats: () => Promise<void>;
    generateShareLink: (contactId: string, expiryInMinutes: number) => Promise<any>;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

const getErrorMessage = (err: any) => {
    if (!err.response || !err.response.data) {
        return 'Server Error';
    }

    if (err.response.data.msg) {
        return err.response.data.msg;
    }

    if (
        Array.isArray(err.response.data.errors) &&
        err.response.data.errors.length > 0
    ) {
        return err.response.data.errors[0].msg;
    }

    return 'Request failed';
};

const contactReducer = (state: ContactState, action: ContactAction): ContactState => {
    switch (action.type) {
        case GET_CONTACTS:
            return {
                ...state,
                contacts: action.payload,
                loading: false,
            };
        case ADD_CONTACT:
            return {
                ...state,
                contacts: [action.payload, ...state.contacts],
                loading: false,
            };
        case UPDATE_CONTACT:
            return {
                ...state,
                contacts: state.contacts.map((contact) =>
                    contact._id === action.payload._id ? action.payload : contact
                ),
                loading: false,
            };
        case DELETE_CONTACT:
            return {
                ...state,
                contacts: state.contacts.filter(
                    (contact) => contact._id !== action.payload
                ),
                loading: false,
            };
        case SET_CURRENT:
            return {
                ...state,
                current: action.payload,
            };
        case CLEAR_CURRENT:
            return {
                ...state,
                current: null,
            };
        case FILTER_CONTACTS:
            return {
                ...state,
                filtered: state.contacts.filter((contact) => {
                    const regex = new RegExp(`${action.payload}`, 'gi');
                    return (
                        contact.name.match(regex) ||
                        (contact.email && contact.email.match(regex))
                    );
                }),
            };
        case CLEAR_FILTER:
            return {
                ...state,
                filtered: null,
            };
        case CONTACT_ERROR:
        case DASHBOARD_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
        case GET_DASHBOARD_STATS:
            return {
                ...state,
                dashboardStats: action.payload,
                loading: false,
            };
        default:
            return state;
    }
};

interface ContactStateProps {
    children: ReactNode;
}

const ContactStateProvider = (props: ContactStateProps) => {
    const initialState: ContactState = {
        contacts: [],
        current: null,
        filtered: null,
        error: null,
        dashboardStats: null,
        loading: true,
    };

    const [state, dispatch] = useReducer(contactReducer, initialState);

    // Get Contacts
    const getContacts = React.useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/contacts');
            dispatch({
                type: GET_CONTACTS,
                payload: res.data,
            });
        } catch (err) {
            dispatch({
                type: CONTACT_ERROR,
                payload: getErrorMessage(err),
            });
        }
    }, []);

    // Add Contact
    const addContact = React.useCallback(async (contact: Contact) => {
        const token = localStorage.getItem('token');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        };

        try {
            const res = await axios.post(
                'http://localhost:5000/api/contacts',
                contact,
                config
            );
            // Backend now returns { contact, warning }
            const contactData = res.data.contact || res.data;
            dispatch({
                type: ADD_CONTACT,
                payload: contactData,
            });

            // If there's a warning about similar contacts, show it
            if (res.data.warning) {
                dispatch({
                    type: CONTACT_ERROR,
                    payload: res.data.warning,
                });
            }
        } catch (err) {
            dispatch({
                type: CONTACT_ERROR,
                payload: getErrorMessage(err),
            });
        }
    }, []);

    // Delete Contact
    const deleteContact = React.useCallback(async (id: string) => {
        try {
            await axios.delete(`http://localhost:5000/api/contacts/${id}`);
            dispatch({
                type: DELETE_CONTACT,
                payload: id,
            });
        } catch (err) {
            dispatch({
                type: CONTACT_ERROR,
                payload: getErrorMessage(err),
            });
        }
    }, []);

    // Update Contact
    const updateContact = React.useCallback(async (contact: Contact) => {
        // Ensure id is present for update
        if (!contact._id) return;

        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        };

        try {
            const res = await axios.put(
                `http://localhost:5000/api/contacts/${contact._id}`,
                contact,
                config
            );
            dispatch({
                type: UPDATE_CONTACT,
                payload: res.data,
            });
        } catch (err) {
            dispatch({
                type: CONTACT_ERROR,
                payload: getErrorMessage(err),
            });
        }
    }, []);

    // Set Current Contact
    const setCurrent = React.useCallback((contact: Contact) => {
        dispatch({ type: SET_CURRENT, payload: contact });
    }, []);

    // Clear Current Contact
    const clearCurrent = React.useCallback(() => {
        dispatch({ type: CLEAR_CURRENT });
    }, []);

    // Filter Contacts
    const filterContacts = React.useCallback((text: string) => {
        dispatch({ type: FILTER_CONTACTS, payload: text });
    }, []);

    // Clear Filter
    const clearFilter = React.useCallback(() => {
        dispatch({ type: CLEAR_FILTER });
    }, []);

    // Get Dashboard Stats
    const getDashboardStats = React.useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard');
            dispatch({
                type: GET_DASHBOARD_STATS,
                payload: res.data,
            });
        } catch (err) {
            dispatch({
                type: DASHBOARD_ERROR,
                payload: getErrorMessage(err),
            });
        }
    }, []);

    // Generate Share Link
    const generateShareLink = React.useCallback(async (contactId: string, expiryInMinutes: number) => {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        };
        try {
            const res = await axios.post(
                `http://localhost:5000/api/share/${contactId}`,
                { expiryInMinutes },
                config
            );
            return res.data;
        } catch (err) {
            console.error(err);
            return null;
        }
    }, []);

    return (
        <ContactContext.Provider
            value={{
                contacts: state.contacts,
                current: state.current,
                filtered: state.filtered,
                error: state.error,
                dashboardStats: state.dashboardStats,
                loading: state.loading,
                getContacts,
                addContact,
                deleteContact,
                setCurrent,
                clearCurrent,
                updateContact,
                filterContacts,
                clearFilter,
                getDashboardStats,
                generateShareLink,
            }}
        >
            {props.children}
        </ContactContext.Provider>
    );
};

export { ContactContext, ContactStateProvider };
