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

export function getZeroPermissions(): UserPermissions {
  return {
    inicio: 'none',
    reuniao: 'none',
    designacoes: 'none',
    mural: 'none',
    chamados: 'none',
    pessoas: 'none',
    membros: 'none',
    seminario: 'none',
    financeiro: 'none',
    agenda: 'none',
    atividades: 'none',
    natal: 'none',
    indicadores: 'none',
    atas: 'none',
    importar: 'none',
    gerenciamento: 'none',
  };
}

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
      gerenciamento: true,
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
      gerenciamento: false,
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
    gerenciamento: false,
  };
}

export type DevRoleOption = UserRole | 'sem_acesso' | 'pendente';

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
  loginAsDevRole: (targetRole: DevRoleOption) => void;
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

// Firebase Client configuration
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

    if (!firebaseUser && !user) {
      setRoleOverride(devRole === 'bispado' ? 'bishopric' : 'council');
    } else {
      setRoleOverride(null);
    }
  }, [firebaseUser, devRole, user]);

  const fetchUserProfile = async (fUser: User): Promise<UserProfile> => {
    try {
      const token = await fUser.getIdToken(true);
      const res = await api.get<{ user: UserProfile }>('/api/auth/me', {
        Authorization: `Bearer ${token}`,
      });
      if (res && res.user) {
        return {
          ...res.user,
          permissoes: res.user.permissoes || (res.user.statusAcesso === 'pendente' ? getZeroPermissions() : getDefaultPermissions(res.user.role)),
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
      canWrite: isBisp,
      cargo: isBisp ? 'Membro do Bispado' : resolvedRole === 'lider_org' ? 'Líder de Organização' : 'Aguardando Aprovação',
      permissoes: isBisp ? getDefaultPermissions('bispado') : getZeroPermissions(),
      statusAcesso: isBisp ? 'aprovado' : 'pendente',
      ativo: true,
    };
  };

  const hasPermission = (moduloId: string): boolean => {
    // 1. If user is pending or refused, they have ZERO access
    if (user?.statusAcesso === 'pendente' || user?.statusAcesso === 'recusado') {
      return false;
    }

    // 2. If user is logged in
    if (user) {
      if (user.isBishopric || user.role === 'bispado') {
        return true;
      }

      // Check granular permissions configured on user profile
      if (user.permissoes) {
        let val = user.permissoes[moduloId];
        if (moduloId === 'chamdes' && val === undefined) {
          val = user.permissoes.chamados;
        }

        if (val === 'write' || val === 'read' || val === true) {
          return true;
        }
        if (val === 'none' || val === false) {
          return false;
        }
      }

      // Fallback to role defaults
      const defaults = getDefaultPermissions(user.role || 'conselho');
      const defVal = moduloId === 'chamdes' ? defaults.chamados : defaults[moduloId];
      return defVal === true || defVal === 'read' || defVal === 'write';
    }

    // 3. Fallback when in anonymous dev simulation without logged in user
    if (devRole === 'bispado') return true;
    const defaults = getDefaultPermissions(devRole);
    const defVal = moduloId === 'chamdes' ? defaults.chamados : defaults[moduloId];
    return defVal === true || defVal === 'read' || defVal === 'write';
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
        localStorage.removeItem('lcr2_dev_user');
        setRoleOverride(null);
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
            setUser(JSON.parse(savedDev));
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
  }, []);

  const signIn = async (email: string, pass: string) => {
    localStorage.removeItem('lcr2_dev_user');
    setRoleOverride(null);
    ensureFirebaseInitialized();
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await fetchUserProfile(userCredential.user);
    setUser(profile);
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    localStorage.removeItem('lcr2_dev_user');
    setRoleOverride(null);
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
    localStorage.removeItem('lcr2_dev_user');
    setRoleOverride(null);
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
    localStorage.removeItem('lcr2_dev_user');
    setRoleOverride(null);
    setUser(null);
    setFirebaseUser(null);
    if (getApps().length) {
      try {
        await firebaseSignOut(getAuth());
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
  };

  const loginAsDevRole = (targetRole: DevRoleOption) => {
    localStorage.removeItem('lcr2_dev_user');

    if (targetRole === 'sem_acesso' || targetRole === 'pendente') {
      setDevRole('conselho');
      setRoleOverride('council');
      const devProfile: UserProfile = {
        uid: 'dev-zero-perms-001',
        email: 'sem.acesso@alabosque.org',
        displayName: 'Usuário Sem Acesso',
        name: 'Usuário Sem Acesso',
        role: 'conselho',
        isBishopric: false,
        canWrite: false,
        statusAcesso: targetRole === 'pendente' ? 'pendente' : 'aprovado',
        cargo: targetRole === 'pendente' ? 'Aguardando Aprovação' : 'Membro Sem Acesso',
        permissoes: getZeroPermissions(),
        ativo: true,
      };
      localStorage.setItem('lcr2_dev_user', JSON.stringify(devProfile));
      setUser(devProfile);
      return;
    }

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
      statusAcesso: 'aprovado',
      ativo: true,
    };

    localStorage.setItem('lcr2_dev_user', JSON.stringify(devProfile));
    setUser(devProfile);
  };

  const toggleDevRole = () => {
    const cur = user?.uid === 'dev-zero-perms-001' ? 'sem_acesso' : (user?.role || devRole);
    const nextRole: DevRoleOption =
      cur === 'bispado' ? 'lider_org' : cur === 'lider_org' ? 'conselho' : cur === 'conselho' ? 'sem_acesso' : 'bispado';
    loginAsDevRole(nextRole);
  };

  const isBispCalculated = Boolean(user ? (user.isBishopric || user.role === 'bispado') : false);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isBishopric: isBispCalculated,
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
