/**
 * Authentication Context
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useMemo } from 'react';
import type { ReactNode } from 'react';
import { authReducer, initialAuthState, type AuthAction } from '../hooks/authReducer';
import type { AuthState } from '../types/auth';

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Memoize so context consumers only re-render when state actually changes,
  // not on every AuthProvider render (inline object literal = new ref every time)
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};




