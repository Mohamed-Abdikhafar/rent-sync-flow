
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '@/lib/types';

// Add nodemailer for email functionality
export const tenantService = {
  async getAllTenants() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tenant');
    
    if (error) throw error;
    return data;
  },
  
  async getTenantById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async inviteTenant(email: string, unitId: string, adminId: string) {
    // Check if email already exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('A user with this email already exists');
    }
    
    // Generate a unique invitation code
    const invitationCode = uuidv4().substring(0, 8).toUpperCase();
    
    // Create invitation record
    const { data, error } = await supabase
      .from('tenant_invitations')
      .insert({
        admin_id: adminId,
        email,
        unit_id: unitId,
        invitation_code: invitationCode,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // In a real application, we would send an email with the invitation code here
    // For now, we'll just return the invitation code
    return {
      invitationCode,
      invitationId: data.id
    };
  },
  
  async verifyInvitation(email: string, invitationCode: string) {
    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('email', email)
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending')
      .single();
    
    if (error || !data) {
      throw new Error('Invalid invitation code');
    }
    
    // Check if invitation is expired
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('Invitation code has expired');
    }
    
    return data;
  },
  
  async acceptInvitation(email: string, invitationCode: string, password: string, firstName: string, lastName: string, phoneNumber: string) {
    // Verify invitation
    const invitation = await this.verifyInvitation(email, invitationCode);
    
    // Create a new Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError || !authData.user) {
      throw authError || new Error('Failed to create user account');
    }
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        role: 'tenant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      throw profileError;
    }
    
    // Update invitation status
    const { error: invitationError } = await supabase
      .from('tenant_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
    
    if (invitationError) {
      throw invitationError;
    }
    
    // Assign tenant to unit
    const { error: unitError } = await supabase
      .from('units')
      .update({ 
        tenant_id: authData.user.id,
        status: 'occupied'
      })
      .eq('id', invitation.unit_id);
    
    if (unitError) {
      throw unitError;
    }
    
    return {
      user: authData.user,
      unitId: invitation.unit_id
    };
  },
  
  async getTenantUnit(tenantId: string) {
    const { data, error } = await supabase
      .from('units')
      .select('*, properties(*)')
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No unit assigned
      }
      throw error;
    }
    
    return data;
  }
};
