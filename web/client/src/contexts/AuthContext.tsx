/**
 * Authentication Context
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer } from 'react';
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

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};




