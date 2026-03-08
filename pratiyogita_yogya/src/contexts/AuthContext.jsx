/* eslint-disable react-refresh/only-export-components */
/**
 * Auth Context stub — Firebase auth has been removed.
 * Re-add Firebase auth here when ready to integrate again.
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext(null);

const noOp = async () => {};

const stubValue = {
  currentUser: null,
  loading: false,
  signup: noOp,
  login: noOp,
  loginWithGoogle: noOp,
  loginWithGithub: noOp,
  logout: noOp,
};

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={stubValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
