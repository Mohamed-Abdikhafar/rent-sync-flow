
import { supabase } from '@/lib/supabase';
import { Payment, PaymentStatus, PaymentType } from '@/lib/types';

export const paymentService = {
  async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getPaymentsByTenantId(tenantId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getPaymentById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async createPayment(payment: {
    tenantId: string;
    unitId: string;
    amount: number;
    type: PaymentType;
    dueDate: string;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: payment.tenantId,
        unit_id: payment.unitId,
        amount: payment.amount,
        type: payment.type,
        status: 'pending',
        due_date: payment.dueDate,
        created_at: new Date().toISOString(),
        description: payment.description || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updatePaymentStatus(id: string, status: PaymentStatus, transactionId?: string) {
    const updates: any = { 
      status,
      ...(status === 'completed' ? { paid_at: new Date().toISOString() } : {})
    };
    
    if (transactionId) {
      updates.transaction_id = transactionId;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async uploadPaymentProof(id: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `payment_proofs/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(filePath);
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({ proof_url: publicUrl })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    return publicUrl;
  },
  
  async getPendingPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  async getCompletedPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed')
      .order('paid_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getOverduePayments() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
