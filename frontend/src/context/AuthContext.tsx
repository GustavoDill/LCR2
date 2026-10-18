import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { setTokenProvider, setRoleOverride, api } from '../api/client';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isBishopric: boolean;
  canWrite: boolean;
  isLoggedIn: boolean;
  role: 'bispado' | 'conselho';
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDevRole: (targetRole: 'bispado' | 'conselho') => void;
  toggleDevRole: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  isBishopric: false,
  canWrite: false,
  isLoggedIn: false,
  role: 'conselho',
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => {},
  signOut: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsDevRole: () => {},
  toggleDevRole: () => {},
});

// Firebase Client configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const hasValidFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'demo-api-key' &&
  firebaseConfig.projectId
);

if (!getApps().length && hasValidFirebaseConfig) {
  try {
    initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('Firebase client initialization warning:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [devRole, setDevRole] = useState<'bispado' | 'conselho'>('bispado');

  // Configure token provider for API requests
  useEffect(() => {
    setTokenProvider(async () => {
      if (firebaseUser) {
        return firebaseUser.getIdToken();
      }
      return null;
    });

    if (!firebaseUser) {
      setRoleOverride(devRole === 'bispado' ? 'bishopric' : 'council');
    } else {
      setRoleOverride(null);
    }
  }, [firebaseUser, devRole]);

  const fetchUserProfile = async (fUser: User): Promise<UserProfile> => {
    try {
      const res = await api.get<{ user: UserProfile }>('/api/auth/me');
      if (res && res.user) {
        return res.user;
      }
    } catch (err) {
      console.warn('Could not fetch server profile, using token claims fallback:', err);
    }

    const tokenResult = await fUser.getIdTokenResult();
    const isBisp = Boolean(
      tokenResult.claims.isBishopric ||
      tokenResult.claims.role === 'bispado' ||
      fUser.email?.toLowerCase().includes('bispo')
    );

    return {
      uid: fUser.uid,
      email: fUser.email || undefined,
      displayName: fUser.displayName || fUser.email?.split('@')[0] || 'Usuário',
      name: fUser.displayName || undefined,
      role: isBisp ? 'bispado' : 'conselho',
      isBishopric: isBisp,
      canWrite: true,
      cargo: isBisp ? 'Membro do Bispado' : 'Líder do Conselho',
      ativo: true,
    };
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const updated = await fetchUserProfile(firebaseUser);
      setUser(updated);
    }
  };

  useEffect(() => {
    if (!hasValidFirebaseConfig) {
      // If no valid Firebase client config, allow dev bypass
      setUser({
        uid: 'dev-bishop-001',
        email: 'bispo@alabosque.org',
        displayName: 'Bispo Ala Bosque',
        name: 'Bispo Ala Bosque',
        role: devRole,
        isBishopric: devRole === 'bispado',
        canWrite: true,
        cargo: devRole === 'bispado' ? 'Bispo' : 'Líder do Conselho',
      });
      setLoading(false);
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const profile = await fetchUserProfile(fUser);
          setUser(profile);
        } catch (e) {
          console.error('Failed to resolve profile on auth state change:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const handleUnauthorized = () => {
      signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      unsubscribe();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [devRole]);

  const signIn = async (email: string, pass: string) => {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateFirebaseProfile(userCredential.user, { displayName: name });
    }
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const signInWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const sendPasswordReset = async (email: string) => {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    if (getApps().length) {
      try {
        await firebaseSignOut(getAuth());
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    setFirebaseUser(null);
    setUser(null);
  };

  const loginAsDevRole = (targetRole: 'bispado' | 'conselho') => {
    setDevRole(targetRole);
    setRoleOverride(targetRole === 'bispado' ? 'bishopric' : 'council');
    setUser({
      uid: targetRole === 'bispado' ? 'local-bishopric' : 'local-council',
      email: targetRole === 'bispado' ? 'bispo@alabosque.org' : 'lider@alabosque.org',
      displayName: targetRole === 'bispado' ? 'Bispo Ala Bosque' : 'Líder do Conselho',
      name: targetRole === 'bispado' ? 'Bispo Ala Bosque' : 'Líder do Conselho',
      role: targetRole,
      isBishopric: targetRole === 'bispado',
      canWrite: true,
      cargo: targetRole === 'bispado' ? 'Bispo' : 'Líder do Conselho',
      ativo: true,
    });
  };

  const toggleDevRole = () => {
    const nextRole = (user?.role || devRole) === 'bispado' ? 'conselho' : 'bispado';
    loginAsDevRole(nextRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isBishopric: user?.isBishopric ?? false,
        canWrite: user?.canWrite ?? false,
        isLoggedIn: !!user,
        role: user?.role ?? devRole,
        signIn,
        signUp,
        signInWithGoogle,
        sendPasswordReset,
        signOut,
        logout: signOut,
        refreshProfile,
        loginAsDevRole,
        toggleDevRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
