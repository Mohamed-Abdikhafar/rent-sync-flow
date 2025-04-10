
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';

export const messageService = {
  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getConversation(user1Id: string, user2Id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },
  
  async sendMessage(senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString(),
        is_read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getUnreadCount(userId: string) {
    const { data, error, count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },
  
  async getAdminContacts() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    
    if (error) throw error;
    return data;
  },
  
  async getTenantContacts() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, units(*), properties(*)')
      .eq('role', 'tenant');
    
    if (error) throw error;
    return data;
  }
};
