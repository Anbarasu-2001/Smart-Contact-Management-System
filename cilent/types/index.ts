// API Configuration
// Replace with your computer's IP address when testing on mobile device
// To find your IP: run 'ipconfig' in terminal and look for IPv4 Address
export const API_URL = 'http://10.147.239.184:5000/api';

// Type definitions for the mobile app
export interface User {
  _id: string;
  name: string;
  email: string;
  date?: string;
}

export interface Contact {
  _id?: string;
  name: string;
  phone: string;
  purpose?: string;
  priority?: 'High' | 'Medium' | 'Low';
  notes?: string;
  howMet?: string;
  category?: 'Family' | 'Friend' | 'Work' | 'Business' | 'Other';
  relationshipScore?: number;
  lastInteractionDate?: Date | string;
  userId?: string;
  date?: string;
}

export interface Message {
  _id: string;
  contactId: string;
  senderId: string;
  content: string;
  timestamp: Date | string;
  type: 'text' | 'image' | 'voice';
  read: boolean;
}

export interface Call {
  _id: string;
  contactId: string;
  userId: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed';
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
}

export interface DashboardStats {
  totalContacts: number;
  highPriorityContacts: number;
  recentInteractions: number;
  avgRelationshipScore: number;
}

// Auth Action Types
export type AuthAction =
  | { type: 'USER_LOADED'; payload: User }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'REGISTER_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'AUTH_ERROR' }
  | { type: 'LOGIN_FAIL' }
  | { type: 'REGISTER_FAIL' }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERRORS' };

// Contact Action Types
export type ContactAction =
  | { type: 'GET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'SET_CURRENT'; payload: Contact }
  | { type: 'CLEAR_CURRENT' }
  | { type: 'FILTER_CONTACTS'; payload: string }
  | { type: 'CLEAR_FILTER' }
  | { type: 'CONTACT_ERROR'; payload: string };
