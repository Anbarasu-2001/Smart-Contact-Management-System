'use client';

import React, { useReducer, createContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SET_ALERT, REMOVE_ALERT } from '../types';

export interface Alert {
    id: string;
    msg: string;
    type: string;
}

type AlertAction =
    | { type: typeof SET_ALERT; payload: Alert }
    | { type: typeof REMOVE_ALERT; payload: string };

interface AlertContextType {
    alerts: Alert[];
    setAlert: (msg: string, type: string, timeout?: number) => void;
}

const AlertContext = createContext<AlertContextType>({
    alerts: [],
    setAlert: () => { },
});

const alertReducer = (state: Alert[], action: AlertAction): Alert[] => {
    switch (action.type) {
        case SET_ALERT:
            return [...state, action.payload];
        case REMOVE_ALERT:
            return state.filter((alert) => alert.id !== action.payload);
        default:
            return state;
    }
};

interface AlertStateProps {
    children: ReactNode;
}

const AlertStateProvider = (props: AlertStateProps) => {
    const initialState: Alert[] = [];

    const [state, dispatch] = useReducer(alertReducer, initialState);

    // Set Alert
    // Set Alert
    const setAlert = React.useCallback((msg: string, type: string, timeout = 5000) => {
        const id = uuidv4();
        dispatch({
            type: SET_ALERT,
            payload: { msg, type, id },
        });

        setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
    }, []);

    return (
        <AlertContext.Provider
            value={{
                alerts: state,
                setAlert,
            }}
        >
            {props.children}
        </AlertContext.Provider>
    );
};

export { AlertContext, AlertStateProvider };
