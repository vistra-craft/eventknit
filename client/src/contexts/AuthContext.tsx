/**
 * Authentication Context
 */

import React, { createContext, useReducer, ReactNode } from 'react';
import { authReducer, initialAuthState, type AuthAction } from '../hooks/authReducer';
import { AuthState, User } from '../types/auth';

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

