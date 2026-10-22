import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
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
import { UserProfile, UserRole, UserPermissions } from '../types';

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'bispado') {
    return {
      inicio: true,
      reuniao: true,
      designacoes: true,
      mural: true,
      chamados: true,
      pessoas: true,
      membros: true,
      seminario: true,
      financeiro: true,
      agenda: true,
      atividades: true,
      natal: true,
      indicadores: true,
      atas: true,
      importar: true,
    };
  }

  if (role === 'lider_org') {
    return {
      inicio: true,
      reuniao: true,
      designacoes: true,
      mural: true,
      chamados: true,
      pessoas: false,
      membros: true,
      seminario: false,
      financeiro: false,
      agenda: true,
      atividades: true,
      natal: true,
      indicadores: true,
      atas: true,
      importar: false,
    };
  }

  // default 'conselho'
  return {
    inicio: true,
    reuniao: true,
    designacoes: true,
    mural: true,
    chamados: false,
    pessoas: false,
    membros: false,
    seminario: false,
    financeiro: false,
    agenda: true,
    atividades: true,
    natal: true,
    indicadores: true,
    atas: true,
    importar: false,
  };
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isBishopric: boolean;
  canWrite: boolean;
  isLoggedIn: boolean;
  role: UserRole;
  hasPermission: (moduloId: string) => boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDevRole: (targetRole: UserRole) => void;
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
  hasPermission: () => false,
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

// Firebase Client configuration with environment variables and project defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCz0JizuP4pDB8GWwKWgOu4dOY1LY_C6ik',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'lcr2-db541.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lcr2-db541',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'lcr2-db541.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '339421225596',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:339421225596:web:2c0a44ce3bff66d6261ff9',
};

function ensureFirebaseInitialized() {
  if (!getApps().length) {
    try {
      initializeApp(firebaseConfig);
    } catch (err) {
      console.warn('Firebase initialization error:', err);
    }
  }
}

// Initial bootstrap
ensureFirebaseInitialized();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [devRole, setDevRole] = useState<UserRole>('bispado');

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
        return {
          ...res.user,
          permissoes: res.user.permissoes || getDefaultPermissions(res.user.role),
        };
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
    const resolvedRole: UserRole = isBisp ? 'bispado' : ((tokenResult.claims.role as UserRole) || 'conselho');

    return {
      uid: fUser.uid,
      email: fUser.email || undefined,
      displayName: fUser.displayName || fUser.email?.split('@')[0] || 'Usuário',
      name: fUser.displayName || undefined,
      role: resolvedRole,
      isBishopric: resolvedRole === 'bispado',
      canWrite: true,
      cargo: resolvedRole === 'bispado' ? 'Membro do Bispado' : resolvedRole === 'lider_org' ? 'Líder de Organização' : 'Líder do Conselho',
      permissoes: getDefaultPermissions(resolvedRole),
      ativo: true,
    };
  };

  const hasPermission = (moduloId: string): boolean => {
    const activeRole = user?.role || devRole;
    if (user?.isBishopric || activeRole === 'bispado') return true;

    // Check custom overrides first
    if (user?.permissoes && user.permissoes[moduloId] !== undefined) {
      return Boolean(user.permissoes[moduloId]);
    }

    // Alias check for navigation IDs
    if (moduloId === 'chamdes') {
      if (user?.permissoes?.chamados !== undefined) return Boolean(user.permissoes.chamados);
    }

    const defaults = getDefaultPermissions(activeRole);
    if (moduloId === 'chamdes') return Boolean(defaults.chamados);
    return Boolean(defaults[moduloId]);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const updated = await fetchUserProfile(firebaseUser);
      setUser(updated);
    }
  };

  useEffect(() => {
    ensureFirebaseInitialized();
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
        const savedDev = localStorage.getItem('lcr2_dev_user');
        if (savedDev) {
          try {
            const parsed = JSON.parse(savedDev);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
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
    ensureFirebaseInitialized();
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    ensureFirebaseInitialized();
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateFirebaseProfile(userCredential.user, { displayName: name });
    }
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const signInWithGoogle = async () => {
    ensureFirebaseInitialized();
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const sendPasswordReset = async (email: string) => {
    ensureFirebaseInitialized();
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
    localStorage.removeItem('lcr2_dev_user');
    setFirebaseUser(null);
    setUser(null);
  };

  const loginAsDevRole = (targetRole: UserRole) => {
    setDevRole(targetRole);
    setRoleOverride(targetRole === 'bispado' ? 'bishopric' : 'council');
    
    let cargo = 'Líder do Conselho';
    let org = undefined;
    if (targetRole === 'bispado') {
      cargo = 'Bispo';
    } else if (targetRole === 'lider_org') {
      cargo = 'Presidente da Sociedade de Socorro';
      org = 'Sociedade de Socorro';
    }

    const devProfile: UserProfile = {
      uid: `local-${targetRole}`,
      email: `${targetRole}@alabosque.org`,
      displayName: targetRole === 'bispado' ? 'Bispo Ala Bosque' : targetRole === 'lider_org' ? 'Pres. Sociedade de Socorro' : 'Líder do Conselho',
      name: targetRole === 'bispado' ? 'Bispo Ala Bosque' : targetRole === 'lider_org' ? 'Pres. Sociedade de Socorro' : 'Líder do Conselho',
      role: targetRole,
      isBishopric: targetRole === 'bispado',
      canWrite: true,
      cargo,
      organizacao: org,
      permissoes: getDefaultPermissions(targetRole),
      ativo: true,
    };

    localStorage.setItem('lcr2_dev_user', JSON.stringify(devProfile));
    setUser(devProfile);
  };

  const toggleDevRole = () => {
    const cur = user?.role || devRole;
    const nextRole: UserRole = cur === 'bispado' ? 'lider_org' : cur === 'lider_org' ? 'conselho' : 'bispado';
    loginAsDevRole(nextRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isBishopric: (user?.isBishopric || (user?.role || devRole) === 'bispado') ?? false,
        canWrite: user?.canWrite ?? false,
        isLoggedIn: !!user,
        role: user?.role ?? devRole,
        hasPermission,
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
