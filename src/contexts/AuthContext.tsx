
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, invitationCode?: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkInvitationCode: (email: string, invitationCode: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function - in a real app, this would authenticate with Supabase
  const login = async (email: string, password: string, invitationCode?: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by email (in a real app, this would check against Supabase Auth)
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // If the user is a tenant and this is a first login with invitation code
      if (foundUser.role === 'tenant' && invitationCode) {
        // In a real app, we would validate the invitation code
        if (invitationCode !== 'INVITE') { // For demo, we're using "INVITE" as the code
          throw new Error('Invalid invitation code');
        }
        
        // Mark user as having completed setup
        foundUser.hasCompletedSetup = true;
      }
      
      // If the user is a tenant and their account is inactive
      if (foundUser.role === 'tenant' && foundUser.isActive === false) {
        throw new Error('Your account has been deactivated. Please contact your property manager.');
      }
      
      // In a real app, we would validate the password here
      
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      toast.success('Login successful');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update password function - for tenants after first login
  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        throw new Error('You must be logged in to update your password');
      }
      
      // In a real app, we would update the password in Supabase Auth
      
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Check invitation code function - to verify invitation codes
  const checkInvitationCode = async (email: string, invitationCode: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, we would check the invitation code against Supabase
      
      // For demo purposes, we're using "INVITE" as the valid code
      return invitationCode === 'INVITE';
    } catch (error) {
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info('You have been logged out');
  };

  // Register function - in a real app, this would create a new user in Supabase
  // Note: This will only be used for admin registration as tenants are created by admins
  const register = async (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email already exists
      const userExists = mockUsers.some(u => u.email === email);
      
      if (userExists) {
        throw new Error('Email already in use');
      }
      
      // Create new user (in a real app, this would create a user in Supabase Auth)
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        role,
        phoneNumber,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Registration successful');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      register,
      updatePassword,
      checkInvitationCode
    }}>
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
