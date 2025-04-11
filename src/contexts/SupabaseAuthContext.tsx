
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

  // Fetch user profile data
  const fetchUserProfile = async (user: SupabaseUser) => {
    try {
      console.log('Fetching profile for user:', user.id);
      
      // Wait a moment for the profile to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // Create a profile if it doesn't exist
        if (error.code === 'PGRST116') {
          console.log('No profile found, attempting to create one...');
          
          try {
            // Fetch user email from auth
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('User not found');
            
            // Create a basic profile
            const newProfileId = uuidv4();
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: newProfileId,
                user_id: user.id,
                email: userData.user.email || '',
                first_name: 'User',
                last_name: userData.user.id.substring(0, 5),
                phone_number: '0000000000',
                role: 'admin', // Default to admin
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('Error creating profile:', createError);
              setAuthState({
                user,
                profile: null,
                loading: false
              });
              return;
            }
            
            // Fetch the newly created profile
            const { data: newProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
              
            if (fetchError || !newProfile) {
              console.error('Error fetching new profile:', fetchError);
              setAuthState({
                user,
                profile: null,
                loading: false
              });
              return;
            }
            
            console.log('Profile created and fetched:', newProfile);
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
            
            // Redirect based on role
            if (newProfile.role === 'admin') {
              navigate(ROUTES.ADMIN.DASHBOARD);
            } else {
              navigate(ROUTES.TENANT.DASHBOARD);
            }
            
            return;
          } catch (createError) {
            console.error('Error in profile creation fallback:', createError);
          }
        }
        
        setAuthState({
          user,
          profile: null,
          loading: false
        });
        return;
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
        
        // Redirect based on role
        if (profile.role === 'admin') {
          navigate(ROUTES.ADMIN.DASHBOARD);
        } else {
          navigate(ROUTES.TENANT.DASHBOARD);
        }
      } else {
        console.log('No profile found for user');
        setAuthState({
          user,
          profile: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setAuthState({
        user,
        profile: null,
        loading: false
      });
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user profile with proper permissions and a unique ID
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: uuidv4(),
          user_id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
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
