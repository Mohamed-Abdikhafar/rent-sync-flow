
import { supabase } from '@/lib/supabase';
import { Document } from '@/lib/types';

export const documentService = {
  async getAllDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getDocumentsByTenantId(tenantId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async uploadDocument(file: File, adminId: string, tenantId?: string, name?: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `documents/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        admin_id: adminId,
        tenant_id: tenantId || null,
        file_url: publicUrl,
        name: name || file.name,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteDocument(id: string) {
    // Get document to find file path
    const { data, error: getError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    // Delete from storage
    const url = new URL(data.file_url);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`documents/${filename}`]);
    
    // Even if storage deletion fails, continue to delete the record
    
    // Delete record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  }
};
