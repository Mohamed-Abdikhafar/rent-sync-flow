
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate, NavigateFunction } from 'react-router-dom';
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
  
  // Use try/catch to handle the case when we're not in a Router context
  let navigate: NavigateFunction;
  try {
    navigate = useNavigate();
  } catch (error) {
    // Define a no-op function when not in a Router context
    navigate = ((to: string) => {
      console.warn('Navigation attempted outside Router context:', to);
    }) as NavigateFunction;
  }

  // Get current session and user on initial load
  useEffect(() => {
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
            console.error('Error fetching user data:', userError);
            throw userError;
          }
          
          if (userData) {
            // Map snake_case fields from DB to camelCase for our frontend
            const mappedUser: RentalSyncUser = {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              phoneNumber: userData.phone_number,
              createdAt: userData.created_at,
              updatedAt: userData.updated_at,
              firstName: userData.first_name,
              lastName: userData.last_name,
              isActive: userData.is_active,
              propertyId: userData.property_id,
              unitId: userData.unit_id,
              invitationCode: userData.invitation_code,
              temporaryPassword: userData.temporary_password,
              hasCompletedSetup: userData.has_completed_setup
            };
            
            setRentalSyncUser(mappedUser);
            
            // Log user data for debugging
            console.log('User data loaded:', mappedUser);
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
      console.log('Auth state changed:', event, newSession?.user?.id);
      
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        // Fetch additional user data whenever auth state changes
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', newSession.user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data on auth change:', userError);
        }
        
        if (userData) {
          // Map snake_case fields from DB to camelCase for our frontend
          const mappedUser: RentalSyncUser = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            phoneNumber: userData.phone_number,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
            firstName: userData.first_name,
            lastName: userData.last_name,
            isActive: userData.is_active,
            propertyId: userData.property_id,
            unitId: userData.unit_id,
            invitationCode: userData.invitation_code,
            temporaryPassword: userData.temporary_password,
            hasCompletedSetup: userData.has_completed_setup
          };
          
          setRentalSyncUser(mappedUser);
          console.log('User data updated on auth change:', mappedUser);
        } else {
          setRentalSyncUser(null);
        }
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
    console.log(`Login function called: ${email}, invitation code: ${invitationCode ? 'provided' : 'not provided'}`);
    setLoading(true);
    try {
      // If invitation code is provided, verify it first
      if (invitationCode) {
        console.log('Verifying invitation code');
        const isValid = await checkInvitationCode(email, invitationCode);
        if (!isValid) {
          console.log('Invalid invitation code');
          throw new Error('Invalid invitation code');
        }
        console.log('Invitation code valid');
      }
      
      console.log('Signing in with Supabase');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      console.log('Supabase auth successful, fetching user data');
      
      // Fetch user data from our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data after login:', userError);
        throw userError;
      }
      
      if (!userData) {
        console.error('No user data found for ID:', data.user.id);
        throw new Error('User record not found');
      }
      
      console.log('User data retrieved:', userData);
      
      // Check if user is active
      if (userData && userData.is_active === false) {
        console.log('User account is deactivated');
        // Sign out the user if they're deactivated
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact your property manager.');
      }
      
      // Map snake_case fields from DB to camelCase for our frontend
      const mappedUser: RentalSyncUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        phoneNumber: userData.phone_number,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        firstName: userData.first_name,
        lastName: userData.last_name,
        isActive: userData.is_active,
        propertyId: userData.property_id,
        unitId: userData.unit_id,
        invitationCode: userData.invitation_code,
        temporaryPassword: userData.temporary_password,
        hasCompletedSetup: userData.has_completed_setup
      };
      
      setRentalSyncUser(mappedUser);
      toast.success('Login successful');
      
      // If this is a first login with invitation code, we'll need to update that
      if (invitationCode && userData) {
        console.log('Updating user record after first login with invitation code');
        await supabase
          .from('users')
          .update({ has_completed_setup: true })
          .eq('id', data.user.id);
      }
      
      // Navigate based on user role - FIXED: Force navigation with a delay to ensure state is updated
      if (userData && userData.role === 'admin') {
        console.log('Navigating to admin dashboard');
        setTimeout(() => {
          navigate(ROUTES.ADMIN.DASHBOARD);
        }, 100);
      } else if (userData && userData.role === 'tenant') {
        console.log('Navigating to tenant dashboard');
        setTimeout(() => {
          navigate(ROUTES.TENANT.DASHBOARD);
        }, 100);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
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
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          is_active: true,
          has_completed_setup: true,
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
      
      // Map snake_case fields from DB to camelCase for our frontend
      const mappedUser: RentalSyncUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        phoneNumber: userData.phone_number,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        firstName: userData.first_name,
        lastName: userData.last_name,
        isActive: userData.is_active,
        propertyId: userData.property_id,
        unitId: userData.unit_id,
        invitationCode: userData.invitation_code,
        temporaryPassword: userData.temporary_password,
        hasCompletedSetup: userData.has_completed_setup
      };
      
      setRentalSyncUser(mappedUser);
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
            temporary_password: null,
            invitation_code: null,
            has_completed_setup: true,
            updated_at: new Date().toISOString()
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
        .select('invitation_code')
        .eq('email', email)
        .eq('invitation_code', invitationCode)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.invitation_code === invitationCode;
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
