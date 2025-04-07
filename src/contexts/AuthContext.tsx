
import React, { createContext, useContext, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, invitationCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkInvitationCode: (email: string, invitationCode: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const {
    rentalSyncUser,
    loading,
    login,
    logout,
    register,
    updatePassword,
    checkInvitationCode,
  } = useSupabaseAuth();

  const value = {
    user: rentalSyncUser,
    loading,
    login,
    logout,
    register,
    updatePassword,
    checkInvitationCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
