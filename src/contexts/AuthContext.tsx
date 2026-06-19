import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, firebaseInitPromise } from '../lib/firebase';

export type AppUser = User | { uid: string; email: string; isMock: boolean };

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginMock: (username: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, loginMock: () => {}, logout: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
        await firebaseInitPromise;
        if (auth) {
           unsubscribe = onAuthStateChanged(auth, (currentUser) => {
              setUser(currentUser);
              setLoading(false);
           });
        } else {
            // Defensively fallback to local session if Firebase is unavailable
            const mockUser = localStorage.getItem('jeecommand_mock_session');
            if (mockUser) {
                setUser({ uid: 'mock-' + mockUser, email: mockUser + '@jeecommand.app', isMock: true });
            }
            setLoading(false);
        }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginMock = (username: string) => {
    localStorage.setItem('jeecommand_mock_session', username);
    setUser({ uid: 'mock-' + username, email: username + '@jeecommand.app', isMock: true });
  };

  const logout = async () => {
    if (auth && user && !('isMock' in user)) {
        await firebaseSignOut(auth);
    } else {
        localStorage.removeItem('jeecommand_mock_session');
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
