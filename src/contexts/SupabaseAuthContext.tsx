
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  user: SupabaseUser | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: UserRole;
  } | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, invitationCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => Promise<void>;
  updateProfile: (data: Partial<AuthState['profile']>) => Promise<void>;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider = ({ children }: SupabaseAuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });
  const navigate = useNavigate();

  // Check for user session on load
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log('Session found, fetching user profile...');
          await fetchUserProfile(data.session.user);
        } else {
          console.log('No session found');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Session check error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            loading: false
          });
        }
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch user profile data with retry mechanism
  const fetchUserProfile = async (user: SupabaseUser) => {
    console.log('Fetching profile for user:', user.id);
    let attempts = 0;
    const maxAttempts = 5;
    const delay = 2000; // 2 seconds delay between attempts
    
    const attemptFetch = async (): Promise<boolean> => {
      try {
        attempts++;
        console.log(`Profile fetch attempt ${attempts} of ${maxAttempts}`);
        
        // Direct SQL query approach to avoid RLS issues
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error(`Profile fetch attempt ${attempts} failed:`, error);
          
          // If this is the last attempt, try to create a profile
          if (attempts >= maxAttempts) {
            return await createDefaultProfile(user);
          }
          
          return false;
        }

        if (profile) {
          console.log('Profile found:', profile);
          
          setAuthState({
            user,
            profile: {
              id: profile.id,
              firstName: profile.first_name,
              lastName: profile.last_name,
              phoneNumber: profile.phone_number,
              role: profile.role as UserRole,
            },
            loading: false
          });
          
          return true;
        } else {
          console.log('No profile found for user');
          
          // If this is the last attempt, try to create a profile
          if (attempts >= maxAttempts) {
            return await createDefaultProfile(user);
          }
          
          return false;
        }
      } catch (error) {
        console.error(`Profile fetch attempt ${attempts} error:`, error);
        
        // If this is the last attempt, try to create a profile
        if (attempts >= maxAttempts) {
          return await createDefaultProfile(user);
        }
        
        return false;
      }
    };
    
    // First attempt
    let success = await attemptFetch();
    
    // Retry logic
    while (!success && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      success = await attemptFetch();
    }
    
    if (!success) {
      console.error('All profile fetch attempts failed');
      setAuthState({
        user,
        profile: null,
        loading: false
      });
    }
  };
  
  // Create a default profile when no profile exists
  const createDefaultProfile = async (user: SupabaseUser): Promise<boolean> => {
    try {
      console.log('Creating default profile for user:', user.id);
      
      // Fetch user email from auth
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }
      
      // Create a new profile with a unique ID
      const newProfileId = uuidv4();
      
      // Use direct SQL approach to bypass RLS
      const { error: createError } = await supabase
        .rpc('create_user_profile', {
          p_id: newProfileId,
          p_user_id: user.id,
          p_email: userData.user.email || '',
          p_first_name: 'User',
          p_last_name: userData.user.id.substring(0, 5),
          p_phone_number: '0000000000',
          p_role: 'admin', // Default role
        });
        
      if (createError) {
        console.error('Profile creation error using RPC:', createError);
        
        // Fallback to direct insert
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: newProfileId,
            user_id: user.id,
            email: userData.user.email || '',
            first_name: 'User',
            last_name: userData.user.id.substring(0, 5),
            phone_number: '0000000000',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Fallback profile creation error:', insertError);
          return false;
        }
      }
      
      // Wait for the profile to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the newly created profile
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (fetchError || !newProfile) {
        console.error('Error fetching new profile:', fetchError);
        return false;
      }
      
      console.log('Profile created and fetched:', newProfile);
      
      // Update state with the new profile
      setAuthState({
        user,
        profile: {
          id: newProfile.id,
          firstName: newProfile.first_name,
          lastName: newProfile.last_name,
          phoneNumber: newProfile.phone_number,
          role: newProfile.role as UserRole,
        },
        loading: false
      });
      
      toast.success('Profile created successfully');
      return true;
    } catch (error) {
      console.error('Error in profile creation:', error);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string, invitationCode?: string) => {
    try {
      console.log('Login function called:', email, 'invitation code:', invitationCode || 'not provided');
      
      // Check if this is a tenant using an invitation code
      if (invitationCode) {
        console.log('Verifying invitation code...');
        const { data: invitation, error: invitationError } = await supabase
          .from('tenant_invitations')
          .select('*')
          .eq('email', email)
          .eq('invitation_code', invitationCode)
          .eq('status', 'pending')
          .single();

        if (invitationError || !invitation) {
          console.error('Invalid invitation code');
          throw new Error('Invalid invitation code or email');
        }
        
        console.log('Valid invitation found, signing in...');
      }
      
      console.log('Signing in with Supabase');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful, user:', data.user?.id);
      // Profile will be fetched by the auth state change listener
      
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => {
    try {
      // For tenant registration, we need to verify they have an invitation
      if (role === 'tenant') {
        console.log('Tenant registration requires an invitation code. Use the login form instead.');
        toast.error('Tenant registration requires an invitation code. Use the login form instead.');
        return;
      }
      
      console.log('Registering new admin account');
      
      // For admins, create a new user account first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }
      
      console.log('User created successfully:', data.user.id);
      
      // Wait longer to ensure the auth session is established
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a unique profile ID
      const profileId = uuidv4();
      
      console.log('Creating profile with ID:', profileId);
      
      // Create user profile - try RPC first
      try {
        const { error: rpcError } = await supabase
          .rpc('create_user_profile', {
            p_id: profileId,
            p_user_id: data.user.id,
            p_email: email,
            p_first_name: firstName,
            p_last_name: lastName,
            p_phone_number: phoneNumber,
            p_role: role,
          });
          
        if (rpcError) {
          console.error('Profile creation via RPC failed:', rpcError);
          throw rpcError;
        }
        
        console.log('Profile created successfully via RPC');
      } catch (rpcError) {
        console.error('RPC error, trying direct insert:', rpcError);
        
        // Fall back to direct insert
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            user_id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw insertError;
        }
      }
      
      toast.success('Registration successful!');
      
      // Redirect the user after successful registration
      if (role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.TENANT.DASHBOARD);
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.info('You have been logged out');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<AuthState['profile']>) => {
    if (!authState.user?.id || !authState.profile?.id) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', authState.user.id);

      if (error) throw error;

      // Update local state
      setAuthState(prev => ({
        ...prev,
        profile: {
          ...prev.profile!,
          ...data
        }
      }));

      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  return (
    <SupabaseAuthContext.Provider 
      value={{ 
        ...authState, 
        login, 
        logout, 
        register, 
        updateProfile 
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
