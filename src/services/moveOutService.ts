
import { supabase } from '@/lib/supabase';
import { MoveOutStatus } from '@/lib/types';

export const moveOutService = {
  async getAllRequests() {
    const { data, error } = await supabase
      .from('move_out_requests')
      .select('*, units(*), profiles(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getRequestsByTenantId(tenantId: string) {
    const { data, error } = await supabase
      .from('move_out_requests')
      .select('*, units(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async createRequest(request: {
    tenantId: string;
    unitId: string;
    moveOutDate: string;
  }) {
    const { data, error } = await supabase
      .from('move_out_requests')
      .insert({
        tenant_id: request.tenantId,
        unit_id: request.unitId,
        move_out_date: request.moveOutDate,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateRequestStatus(id: string, status: MoveOutStatus) {
    const { data, error } = await supabase
      .from('move_out_requests')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If approved, update the unit status and remove tenant
    if (status === 'approved') {
      const request = data;
      
      const { error: unitError } = await supabase
        .from('units')
        .update({ 
          status: 'vacant',
          tenant_id: null,
          lease_end_date: request.move_out_date
        })
        .eq('id', request.unit_id);
      
      if (unitError) throw unitError;
    }
    
    return data;
  }
};
