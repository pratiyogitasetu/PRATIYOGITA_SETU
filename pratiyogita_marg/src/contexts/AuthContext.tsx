/**
 * Auth Context stub — Firebase auth has been removed.
 * Re-add Firebase auth here when ready to integrate again.
 */
import React, { createContext, useContext } from 'react';

type AuthContextValue = {
  currentUser: null;
  loading: boolean;
  signup: (...args: any[]) => Promise<any>;
  login: (...args: any[]) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithGithub: () => Promise<any>;
  logout: () => Promise<void>;
};

const noOp = async () => {};

const stubValue: AuthContextValue = {
  currentUser: null,
  loading: false,
  signup: noOp,
  login: noOp,
  loginWithGoogle: noOp,
  loginWithGithub: noOp,
  logout: noOp,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={stubValue}>{children}</AuthContext.Provider>;
}
