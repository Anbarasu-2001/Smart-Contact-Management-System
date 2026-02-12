'use client';

import React, { useReducer, createContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import {
    REGISTER_SUCCESS,
    REGISTER_FAIL,
    USER_LOADED,
    AUTH_ERROR,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    CLEAR_ERRORS,
} from '../types';
import setAuthToken from '../../utils/setAuthToken';

// Define types for state and actions
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    // Add other user properties as needed
}

export interface AuthState {
    token: string | null;
    isAuthenticated: boolean | null;
    loading: boolean;
    user: User | null;
    error: string | null;
}

type AuthAction =
    | { type: typeof USER_LOADED; payload: User }
    | { type: typeof REGISTER_SUCCESS; payload: { token: string } }
    | { type: typeof LOGIN_SUCCESS; payload: { token: string } }
    | { type: typeof REGISTER_FAIL; payload: string }
    | { type: typeof AUTH_ERROR; payload?: string }
    | { type: typeof LOGIN_FAIL; payload: string }
    | { type: typeof LOGOUT }
    | { type: typeof CLEAR_ERRORS };

interface AuthContextType extends AuthState {
    register: (formData: any) => Promise<boolean>;
    loadUser: () => Promise<boolean>;
    login: (formData: any) => Promise<boolean>;
    logout: () => void;
    clearErrors: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case USER_LOADED:
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload,
            };
        case REGISTER_SUCCESS:
        case LOGIN_SUCCESS:
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false,
            };
        case REGISTER_FAIL:
        case AUTH_ERROR:
        case LOGIN_FAIL:
        case LOGOUT:
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false, // Changed from source: ensure loading stops
                user: null,
                error: 'payload' in action ? (action.payload as string) : null,
            };
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

interface AuthStateProps {
    children: ReactNode;
}

const AuthStateProvider = (props: AuthStateProps) => {
    const initialState: AuthState = {
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
        isAuthenticated: null,
        loading: true,
        user: null,
        error: null,
    };

    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = React.useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            dispatch({ type: AUTH_ERROR });
            return false;
        }
        setAuthToken(token);

        try {
            const res = await axios.get('http://localhost:5000/api/auth/user');
            dispatch({
                type: USER_LOADED,
                payload: res.data,
            });
            return true;
        } catch (err) {
            dispatch({ type: AUTH_ERROR });
            return false;
        }
    }, []);

    // Persist token check on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            loadUser();
        } else {
            dispatch({ type: AUTH_ERROR }); // Ensure state reflects no auth
        }
    }, []);

    // Register User
    const register = React.useCallback(async (formData: any) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const res = await axios.post(
                'http://localhost:5000/api/auth/register',
                formData,
                config
            );

            const token = res.data.token;
            localStorage.setItem('token', token);
            setAuthToken(token);

            dispatch({
                type: REGISTER_SUCCESS,
                payload: res.data,
            });

            return await loadUser();
        } catch (err: any) {
            dispatch({
                type: REGISTER_FAIL,
                payload: err.response?.data?.msg || 'Registration failed',
            });
            localStorage.removeItem('token');
            setAuthToken(null);
            return false;
        }
    }, [loadUser]);

    // Login User
    const login = React.useCallback(async (formData: any) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const res = await axios.post(
                'http://localhost:5000/api/auth/login',
                formData,
                config
            );

            const token = res.data.token;
            localStorage.setItem('token', token);
            setAuthToken(token);

            dispatch({
                type: LOGIN_SUCCESS,
                payload: res.data,
            });

            return await loadUser();
        } catch (err: any) {
            dispatch({
                type: LOGIN_FAIL,
                payload: err.response?.data?.msg || 'Login failed',
            });
            localStorage.removeItem('token');
            setAuthToken(null);
            return false;
        }
    }, [loadUser]);

    // Logout
    const logout = React.useCallback(() => {
        localStorage.removeItem('token');
        setAuthToken(null);
        dispatch({ type: LOGOUT });
    }, []);

    // Clear Errors
    const clearErrors = React.useCallback(() => dispatch({ type: CLEAR_ERRORS }), []);

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                error: state.error,
                register,
                loadUser,
                login,
                logout,
                clearErrors,
            }}
        >
            {props.children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthStateProvider };
