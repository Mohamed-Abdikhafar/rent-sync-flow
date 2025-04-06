
import { supabase } from '@/lib/supabase';
import { TenantFormData } from '@/components/forms/CreateTenantForm';
import { generateInvitationCode, generateTemporaryPassword } from '@/lib/utils/tenantUtils';
import { User } from '@/lib/types';

// Create a new tenant
export const createTenant = async (data: TenantFormData, adminId: string): Promise<User> => {
  // Generate invitation code and temporary password
  const invitationCode = generateInvitationCode();
  const temporaryPassword = generateTemporaryPassword();
  
  // First, check if email is already in use
  const { data: existingUser, error: userCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existingUser) {
    throw new Error('Email is already in use');
  }

  if (userCheckError && userCheckError.code !== 'PGRST116') {
    throw userCheckError;
  }
  
  // Get unit and property information
  const { data: unit, error: unitError } = await supabase
    .from('units')
    .select('*, properties!inner(*)')
    .eq('id', data.unitId)
    .single();
  
  if (unitError) {
    throw new Error('Failed to fetch unit details');
  }
  
  // Create auth user with Supabase
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: temporaryPassword,
    email_confirm: true,
  });
  
  if (authError) {
    throw authError;
  }
  
  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  // Insert the user into our custom users table
  const newUser = {
    id: authData.user.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    role: 'tenant' as const,
    invitationCode,
    temporaryPassword,
    isActive: true,
    propertyId: unit.propertyId,
    unitId: data.unitId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasCompletedSetup: false,
  };

  const { data: insertedUser, error: insertError } = await supabase
    .from('users')
    .insert(newUser)
    .select()
    .single();

  if (insertError) {
    // Clean up the auth user if our custom table insert fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw insertError;
  }

  // Update the unit to be occupied and link it to the tenant
  const { error: updateUnitError } = await supabase
    .from('units')
    .update({
      status: 'occupied',
      tenantId: authData.user.id,
      leaseStartDate: data.leaseStartDate.toISOString(),
      leaseEndDate: data.leaseEndDate.toISOString(),
    })
    .eq('id', data.unitId);

  if (updateUnitError) {
    // This is a critical error as the unit is not properly linked
    // We should clean up everything we've created
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from('users').delete().eq('id', authData.user.id);
    throw updateUnitError;
  }

  // TODO: Send invitation email to the tenant
  // In a real app, we would call a Supabase Edge Function to send the email
  console.log('Would send email to', data.email, 'with invitation code', invitationCode, 'and temporary password', temporaryPassword);

  return insertedUser as User;
};

// Remove a tenant
export const removeTenant = async (tenantId: string): Promise<void> => {
  // Get tenant's unit information
  const { data: tenant, error: tenantError } = await supabase
    .from('users')
    .select('unitId')
    .eq('id', tenantId)
    .single();

  if (tenantError) {
    throw tenantError;
  }

  // Deactivate tenant account
  const { error: updateError } = await supabase
    .from('users')
    .update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (updateError) {
    throw updateError;
  }

  // Update unit status to vacant and remove tenant association
  if (tenant?.unitId) {
    const { error: unitError } = await supabase
      .from('units')
      .update({
        status: 'vacant',
        tenantId: null,
        leaseStartDate: null,
        leaseEndDate: null,
      })
      .eq('id', tenant.unitId);

    if (unitError) {
      throw unitError;
    }
  }

  // TODO: Send notification email to tenant about account deactivation
  console.log('Would send deactivation email to tenant', tenantId);
};

// Get tenants for a specific property
export const getTenantsByProperty = async (propertyId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      units (
        id,
        unitNumber,
        rentAmount,
        status,
        leaseStartDate,
        leaseEndDate
      )
    `)
    .eq('role', 'tenant')
    .eq('propertyId', propertyId);

  if (error) {
    throw error;
  }

  return data as User[];
};

// Get available (vacant) units for a specific property
export const getAvailableUnits = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('propertyId', propertyId)
    .eq('status', 'vacant');

  if (error) {
    throw error;
  }

  return data;
};
