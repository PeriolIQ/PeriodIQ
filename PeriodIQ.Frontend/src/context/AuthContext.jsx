import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  getCurrentSession,
  getUserAttributes,
  getUserGroups,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);   // { sub, email, name, ... }
  const [groups, setGroups]           = useState([]);     // Cognito groups, vd ['Admins']
  const [isAuthenticated, setIsAuth]  = useState(false);
  const [isLoading, setIsLoading]     = useState(true);   // đang kiểm tra session lúc khởi động

  // ─── Kiểm tra session khi app khởi động ───────────────────────────────────
  useEffect(() => {
    getCurrentSession()
      .then(async (result) => {
        if (result) {
          const [attrs, userGroups] = await Promise.all([getUserAttributes(), getUserGroups()]);
          setUser(attrs);
          setGroups(userGroups);
          setIsAuth(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    await cognitoSignIn(email, password);
    const [attrs, userGroups] = await Promise.all([getUserAttributes(), getUserGroups()]);
    setUser(attrs);
    setGroups(userGroups);
    setIsAuth(true);
    return attrs;
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, fullName) => {
    return await cognitoSignUp(email, password, fullName);
  }, []);

  // ─── Confirm OTP ──────────────────────────────────────────────────────────
  const confirmOtp = useCallback(async (email, code) => {
    return await cognitoConfirmSignUp(email, code);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    cognitoSignOut();
    setUser(null);
    setGroups([]);
    setIsAuth(false);
  }, []);

  const isAdmin = groups.includes('Admins');

  return (
    <AuthContext.Provider
      value={{ user, groups, isAdmin, isAuthenticated, isLoading, login, register, confirmOtp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
}
