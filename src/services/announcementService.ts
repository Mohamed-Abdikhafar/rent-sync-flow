
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/types';

export const announcementService = {
  async getAllAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getAnnouncementsByPropertyId(propertyId: string) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, profiles(*)')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getAnnouncementById(id: string) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async createAnnouncement(announcement: {
    adminId: string;
    title: string;
    content: string;
    propertyId?: string;
  }) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        admin_id: announcement.adminId,
        property_id: announcement.propertyId || null,
        title: announcement.title,
        content: announcement.content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getAnnouncementsForTenant(tenantId: string) {
    // Find tenant's unit
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('property_id')
      .eq('tenant_id', tenantId)
      .single();
    
    if (unitError) {
      if (unitError.code === 'PGRST116') {
        return []; // No unit assigned
      }
      throw unitError;
    }
    
    // Get all announcements for tenant's property or global announcements (null property_id)
    const { data, error } = await supabase
      .from('announcements')
      .select('*, profiles(*)')
      .or(`property_id.eq.${unit.property_id},property_id.is.null`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
