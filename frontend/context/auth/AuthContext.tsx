"use client";

import React, { useReducer, createContext, ReactNode, useEffect } from "react";

import api from "../../utils/api";
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_ERRORS,
} from "../types";
import setAuthToken from "../../utils/setAuthToken";

// Define types for state and actions
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
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
        error: "payload" in action ? (action.payload as string) : null,
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
    token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
    isAuthenticated: null,
    loading: true,
    user: null,
    error: null,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load User
  const loadUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch({ type: AUTH_ERROR });

      return false;
    }
    setAuthToken(token);

    try {
      const res = await api.get("/auth/user");

      dispatch({
        type: USER_LOADED,
        payload: res.data,
      });

      return true;
    } catch (err: any) {
      console.error("loadUser error:", err.message);
      dispatch({ type: AUTH_ERROR });

      return false;
    }
  };

  // Persist token check on mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setAuthToken(token);
      loadUser();
    } else {
      dispatch({ type: AUTH_ERROR }); // Ensure state reflects no auth
    }
  }, []);

  const register = async (formData: any) => {
    try {
      const res = await api.post("/auth/register", formData);

      const token = res.data.token;

      localStorage.setItem("token", token);
      setAuthToken(token);

      dispatch({
        type: REGISTER_SUCCESS,
        payload: res.data,
      });

      return await loadUser();
    } catch (err: any) {
      console.error("Registration failed:", err.message);
      dispatch({
        type: REGISTER_FAIL,
        payload: err.response?.data?.msg || "Registration failed",
      });
      localStorage.removeItem("token");
      setAuthToken(null);

      return false;
    }
  };

  const login = async (formData: any) => {
    try {
      const res = await api.post("/auth/login", formData);

      const token = res.data.token;

      localStorage.setItem("token", token);
      setAuthToken(token);

      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data,
      });

      return await loadUser();
    } catch (err: any) {
      console.error("Login failed:", err.message);
      dispatch({
        type: LOGIN_FAIL,
        payload: err.response?.data?.msg || "Login failed",
      });
      localStorage.removeItem("token");
      setAuthToken(null);

      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    dispatch({ type: LOGOUT });
  };

  // Clear Errors
  const clearErrors = () => dispatch({ type: CLEAR_ERRORS });

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
