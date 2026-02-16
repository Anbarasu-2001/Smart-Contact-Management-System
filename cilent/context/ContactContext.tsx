import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import axios from 'axios';
import { Contact, ContactAction, API_URL } from '../types';

interface ContactState {
  contacts: Contact[];
  current: Contact | null;
  filtered: Contact[] | null;
  loading: boolean;
  error: string | null;
}

interface ContactContextType extends ContactState {
  getContacts: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setCurrent: (contact: Contact) => void;
  clearCurrent: () => void;
  filterContacts: (text: string) => void;
  clearFilter: () => void;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

const contactReducer = (state: ContactState, action: ContactAction): ContactState => {
  switch (action.type) {
    case 'GET_CONTACTS':
      return {
        ...state,
        contacts: action.payload,
        loading: false,
        error: null,
      };
    case 'ADD_CONTACT':
      return {
        ...state,
        contacts: [action.payload, ...state.contacts],
        loading: false,
        error: null,
      };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((contact) =>
          contact._id === action.payload._id ? action.payload : contact
        ),
        loading: false,
        error: null,
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((contact) => contact._id !== action.payload),
        loading: false,
        error: null,
      };
    case 'SET_CURRENT':
      return {
        ...state,
        current: action.payload,
      };
    case 'CLEAR_CURRENT':
      return {
        ...state,
        current: null,
      };
    case 'FILTER_CONTACTS':
      return {
        ...state,
        filtered: state.contacts.filter((contact) => {
          const regex = new RegExp(`${action.payload}`, 'gi');
          return contact.name.match(regex) || contact.phone?.match(regex);
        }),
      };
    case 'CLEAR_FILTER':
      return {
        ...state,
        filtered: null,
      };
    case 'CONTACT_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

export const ContactProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState: ContactState = {
    contacts: [],
    current: null,
    filtered: null,
    loading: false,
    error: null,
  };

  const [state, dispatch] = useReducer(contactReducer, initialState);

  // Get contacts
  const getContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/contacts`);
      dispatch({ type: 'GET_CONTACTS', payload: res.data });
    } catch (err: any) {
      dispatch({
        type: 'CONTACT_ERROR',
        payload: err.response?.data?.msg || 'Failed to fetch contacts',
      });
    }
  };

  // Add contact
  const addContact = async (contact: Contact) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    try {
      const res = await axios.post(`${API_URL}/contacts`, contact, config);
      dispatch({ type: 'ADD_CONTACT', payload: res.data });
    } catch (err: any) {
      dispatch({
        type: 'CONTACT_ERROR',
        payload: err.response?.data?.msg || 'Failed to add contact',
      });
      throw err;
    }
  };

  // Update contact
  const updateContact = async (contact: Contact) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    try {
      const res = await axios.put(`${API_URL}/contacts/${contact._id}`, contact, config);
      dispatch({ type: 'UPDATE_CONTACT', payload: res.data });
    } catch (err: any) {
      dispatch({
        type: 'CONTACT_ERROR',
        payload: err.response?.data?.msg || 'Failed to update contact',
      });
      throw err;
    }
  };

  // Delete contact
  const deleteContact = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/contacts/${id}`);
      dispatch({ type: 'DELETE_CONTACT', payload: id });
    } catch (err: any) {
      dispatch({
        type: 'CONTACT_ERROR',
        payload: err.response?.data?.msg || 'Failed to delete contact',
      });
    }
  };

  // Set current contact
  const setCurrent = (contact: Contact) => {
    dispatch({ type: 'SET_CURRENT', payload: contact });
  };

  // Clear current contact
  const clearCurrent = () => {
    dispatch({ type: 'CLEAR_CURRENT' });
  };

  // Filter contacts
  const filterContacts = (text: string) => {
    dispatch({ type: 'FILTER_CONTACTS', payload: text });
  };

  // Clear filter
  const clearFilter = () => {
    dispatch({ type: 'CLEAR_FILTER' });
  };

  return (
    <ContactContext.Provider
      value={{
        ...state,
        getContacts,
        addContact,
        updateContact,
        deleteContact,
        setCurrent,
        clearCurrent,
        filterContacts,
        clearFilter,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within ContactProvider');
  }
  return context;
};

export { ContactContext };
