
import { supabase } from '@/lib/supabase';
import { MaintenanceRequest, MaintenanceStatus } from '@/lib/types';

export const maintenanceService = {
  async getAllRequests() {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*, units(*), profiles(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getRequestsByTenantId(tenantId: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*, units(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getRequestById(id: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*, units(*), profiles(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async createRequest(request: {
    tenantId: string;
    unitId: string;
    description: string;
  }, photo?: File) {
    let photoUrl = null;
    
    if (photo) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `maintenance-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `maintenance_photos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('maintenance_photos')
        .upload(filePath, photo);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('maintenance_photos')
        .getPublicUrl(filePath);
      
      photoUrl = publicUrl;
    }
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        tenant_id: request.tenantId,
        unit_id: request.unitId,
        description: request.description,
        photo_url: photoUrl,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateRequestStatus(id: string, status: MaintenanceStatus) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
