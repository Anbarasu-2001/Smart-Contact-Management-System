import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User, AuthAction, API_URL } from '../types';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  loadUser: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearErrors: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.type === 'LOGOUT' ? null : 'Authentication failed',
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState: AuthState = {
    token: null,
    isAuthenticated: false,
    loading: true,
    user: null,
    error: null,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  const setAuthToken = async (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      await AsyncStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      await AsyncStorage.removeItem('token');
    }
  };

  // Load user
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('loadUser - token exists:', !!token);
      if (token) {
        setAuthToken(token);
        const res = await axios.get(`${API_URL}/auth/user`);
        console.log('loadUser - user loaded:', res.data.name);
        dispatch({ type: 'USER_LOADED', payload: res.data });
      } else {
        console.log('loadUser - no token found');
        dispatch({ type: 'AUTH_ERROR' });
      }
    } catch (err) {
      console.error('loadUser - error:', err);
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  // Check for token on mount
  React.useEffect(() => {
    loadUser();
  }, []);

  // Register user
  const register = async (name: string, email: string, password: string) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    try {
      const res = await axios.post(
        `${API_URL}/auth/register`,
        { name, email, password },
        config
      );
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
      await setAuthToken(res.data.token);
      await loadUser();
    } catch (err: any) {
      dispatch({ type: 'REGISTER_FAIL' });
      throw new Error(err.response?.data?.msg || 'Registration failed');
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    try {
      console.log('Login attempt for:', email);
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        config
      );
      console.log('Login response received, token:', res.data.token?.substring(0, 20) + '...');
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      await setAuthToken(res.data.token);
      console.log('Token set, loading user...');
      await loadUser();
      console.log('Login complete');
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      dispatch({ type: 'LOGIN_FAIL' });
      throw new Error(err.response?.data?.msg || 'Login failed');
    }
  };

  // Logout
  const logout = async () => {
    await setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  // Clear errors
  const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loadUser,
        register,
        login,
        logout,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { AuthContext };
