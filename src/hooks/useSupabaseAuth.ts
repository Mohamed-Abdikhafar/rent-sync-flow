
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { User as RentalSyncUser, UserRole } from '@/lib/types';

interface UseSupabaseAuthReturn {
  session: Session | null;
  user: User | null;
  rentalSyncUser: RentalSyncUser | null;
  loading: boolean;
  login: (email: string, password: string, invitationCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkInvitationCode: (email: string, invitationCode: string) => Promise<boolean>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rentalSyncUser, setRentalSyncUser] = useState<RentalSyncUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current session and user on initial load
    const getCurrentSession = async () => {
      setLoading(true);
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession) {
          setUser(currentSession.user);
          
          // Fetch additional user data from our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          if (userError) {
            throw userError;
          }
          
          if (userData) {
            setRentalSyncUser(userData as RentalSyncUser);
          }
        }
      } catch (error) {
        console.error('Error getting current session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        // Fetch additional user data whenever auth state changes
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', newSession.user.id)
          .single();
        
        setRentalSyncUser(userData as RentalSyncUser || null);
      } else {
        setRentalSyncUser(null);
      }
    });
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string, invitationCode?: string) => {
    setLoading(true);
    try {
      // If invitation code is provided, verify it first
      if (invitationCode) {
        const isValid = await checkInvitationCode(email, invitationCode);
        if (!isValid) {
          throw new Error('Invalid invitation code');
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // Fetch user data from our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      // Check if user is active
      if (userData && userData.isActive === false) {
        // Sign out the user if they're deactivated
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact your property manager.');
      }
      
      setRentalSyncUser(userData as RentalSyncUser);
      toast.success('Login successful');
      
      // If this is a first login with invitation code, we'll need to update that
      if (invitationCode && userData) {
        await supabase
          .from('users')
          .update({ hasCompletedSetup: true })
          .eq('id', data.user.id);
      }
      
      // Navigate based on user role
      if (userData && userData.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else if (userData && userData.role === 'tenant') {
        navigate(ROUTES.TENANT.DASHBOARD);
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function - primarily used for admin registration
  const register = async (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => {
    setLoading(true);
    try {
      // First register the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('User creation failed');
      }
      
      // Now create a record in our custom users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          role,
          firstName,
          lastName,
          phoneNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          hasCompletedSetup: true,
        });
      
      if (insertError) {
        // If there was an error inserting to our custom table, we should clean up the auth user
        console.error('Error creating user in custom table, cleaning up auth user:', insertError);
        throw insertError;
      }
      
      // Fetch the newly created user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      setRentalSyncUser(userData as RentalSyncUser);
      toast.success('Registration successful');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setRentalSyncUser(null);
      toast.info('You have been logged out');
      navigate(ROUTES.LOGIN);
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      // If the user has a temporary password, clear it
      if (rentalSyncUser) {
        await supabase
          .from('users')
          .update({
            temporaryPassword: null,
            invitationCode: null,
            hasCompletedSetup: true,
            updatedAt: new Date().toISOString()
          })
          .eq('id', rentalSyncUser.id);
      }
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check invitation code function
  const checkInvitationCode = async (email: string, invitationCode: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('invitationCode')
        .eq('email', email)
        .eq('invitationCode', invitationCode)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.invitationCode === invitationCode;
    } catch (error) {
      console.error('Error checking invitation code:', error);
      return false;
    }
  };

  return {
    session,
    user,
    rentalSyncUser,
    loading,
    login,
    logout,
    register,
    updatePassword,
    checkInvitationCode,
  };
}
