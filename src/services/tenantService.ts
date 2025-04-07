
import { supabase } from '@/lib/supabase';
import { TenantFormData } from '@/components/forms/CreateTenantForm';
import { generateInvitationCode, generateTemporaryPassword } from '@/lib/utils/tenantUtils';
import { User, Unit } from '@/lib/types';

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
    first_name: data.firstName,
    last_name: data.lastName,
    phone_number: data.phoneNumber,
    role: 'tenant' as const,
    invitation_code: invitationCode,
    temporary_password: temporaryPassword,
    is_active: true,
    property_id: unit.propertyId,
    unit_id: data.unitId,
    has_completed_setup: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
      tenant_id: authData.user.id,
      lease_start_date: data.leaseStartDate.toISOString(),
      lease_end_date: data.leaseEndDate.toISOString(),
    })
    .eq('id', data.unitId);

  if (updateUnitError) {
    // This is a critical error as the unit is not properly linked
    // We should clean up everything we've created
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from('users').delete().eq('id', authData.user.id);
    throw updateUnitError;
  }

  // Convert snake_case from DB to camelCase for our frontend
  const mappedUser: User = {
    id: insertedUser.id,
    email: insertedUser.email,
    role: insertedUser.role,
    phoneNumber: insertedUser.phone_number,
    createdAt: insertedUser.created_at,
    updatedAt: insertedUser.updated_at,
    firstName: insertedUser.first_name,
    lastName: insertedUser.last_name,
    isActive: insertedUser.is_active,
    propertyId: insertedUser.property_id,
    unitId: insertedUser.unit_id,
    invitationCode: insertedUser.invitation_code,
    temporaryPassword: insertedUser.temporary_password,
    hasCompletedSetup: insertedUser.has_completed_setup
  };

  // TODO: Send invitation email to the tenant
  // In a real app, we would call a Supabase Edge Function to send the email
  console.log('Would send email to', data.email, 'with invitation code', invitationCode, 'and temporary password', temporaryPassword);

  return mappedUser;
};

// Remove a tenant
export const removeTenant = async (tenantId: string): Promise<void> => {
  // Get tenant's unit information
  const { data: tenant, error: tenantError } = await supabase
    .from('users')
    .select('unit_id')
    .eq('id', tenantId)
    .single();

  if (tenantError) {
    throw tenantError;
  }

  // Deactivate tenant account
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (updateError) {
    throw updateError;
  }

  // Update unit status to vacant and remove tenant association
  if (tenant?.unit_id) {
    const { error: unitError } = await supabase
      .from('units')
      .update({
        status: 'vacant',
        tenant_id: null,
        lease_start_date: null,
        lease_end_date: null,
      })
      .eq('id', tenant.unit_id);

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
        unit_number,
        rent_amount,
        status,
        lease_start_date,
        lease_end_date
      )
    `)
    .eq('role', 'tenant')
    .eq('property_id', propertyId);

  if (error) {
    throw error;
  }

  // Map the snake_case field names to camelCase for our frontend
  const mappedUsers = data.map((user: any): User => ({
    id: user.id,
    email: user.email,
    role: user.role,
    phoneNumber: user.phone_number,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: user.is_active,
    propertyId: user.property_id,
    unitId: user.unit_id,
    invitationCode: user.invitation_code,
    temporaryPassword: user.temporary_password,
    hasCompletedSetup: user.has_completed_setup
  }));

  return mappedUsers;
};

// Get available (vacant) units for a specific property
export const getAvailableUnits = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'vacant');

  if (error) {
    throw error;
  }

  return data;
};
