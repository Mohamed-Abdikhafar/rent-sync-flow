
import { supabase } from '@/lib/supabase';
import { Property, Unit } from '@/lib/types';

export const propertyService = {
  async getAllProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async addProperty(property: Omit<Property, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        admin_id: property.adminId,
        name: property.name,
        address: property.address,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateProperty(id: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({
        name: updates.name,
        address: updates.address
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  async getUnitsByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .order('unit_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  async addUnit(unit: Omit<Unit, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('units')
      .insert({
        property_id: unit.propertyId,
        unit_number: unit.unitNumber,
        rent_amount: unit.rentAmount,
        status: unit.status,
        tenant_id: unit.tenantId || null,
        lease_start_date: unit.leaseStartDate || null,
        lease_end_date: unit.leaseEndDate || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateUnit(id: string, updates: Partial<Unit>) {
    const { data, error } = await supabase
      .from('units')
      .update({
        unit_number: updates.unitNumber,
        rent_amount: updates.rentAmount,
        status: updates.status,
        tenant_id: updates.tenantId || null,
        lease_start_date: updates.leaseStartDate || null,
        lease_end_date: updates.leaseEndDate || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getVacantUnits() {
    const { data, error } = await supabase
      .from('units')
      .select('*, properties(*)')
      .eq('status', 'vacant');
    
    if (error) throw error;
    return data;
  }
};
