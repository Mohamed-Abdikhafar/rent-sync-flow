
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          admin_id: string
          name: string
          address: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          name: string
          address: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          name?: string
          address?: string
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          rent_amount: number
          status: 'occupied' | 'vacant' | 'maintenance'
          tenant_id: string | null
          lease_start_date: string | null
          lease_end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          rent_amount: number
          status: 'occupied' | 'vacant' | 'maintenance'
          tenant_id?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          unit_number?: string
          rent_amount?: number
          status?: 'occupied' | 'vacant' | 'maintenance'
          tenant_id?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          unit_id: string
          amount: number
          type: 'rent' | 'utility' | 'late_fee'
          status: 'pending' | 'completed' | 'failed'
          transaction_id: string | null
          due_date: string
          paid_at: string | null
          created_at: string
          description: string | null
          proof_url: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          unit_id: string
          amount: number
          type: 'rent' | 'utility' | 'late_fee'
          status: 'pending' | 'completed' | 'failed'
          transaction_id?: string | null
          due_date: string
          paid_at?: string | null
          created_at?: string
          description?: string | null
          proof_url?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          unit_id?: string
          amount?: number
          type?: 'rent' | 'utility' | 'late_fee'
          status?: 'pending' | 'completed' | 'failed'
          transaction_id?: string | null
          due_date?: string
          paid_at?: string | null
          created_at?: string
          description?: string | null
          proof_url?: string | null
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          tenant_id: string
          unit_id: string
          description: string
          photo_url: string | null
          status: 'submitted' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          unit_id: string
          description: string
          photo_url?: string | null
          status: 'submitted' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          unit_id?: string
          description?: string
          photo_url?: string | null
          status?: 'submitted' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      move_out_requests: {
        Row: {
          id: string
          tenant_id: string
          unit_id: string
          move_out_date: string
          status: 'pending' | 'approved' | 'denied'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          unit_id: string
          move_out_date: string
          status: 'pending' | 'approved' | 'denied'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          unit_id?: string
          move_out_date?: string
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          is_read?: boolean
        }
      }
      announcements: {
        Row: {
          id: string
          admin_id: string
          property_id: string | null
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          property_id?: string | null
          title: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          property_id?: string | null
          title?: string
          content?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          admin_id: string
          tenant_id: string | null
          file_url: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          tenant_id?: string | null
          file_url: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          tenant_id?: string | null
          file_url?: string
          name?: string
          created_at?: string
        }
      }
      tenant_invitations: {
        Row: {
          id: string
          admin_id: string
          email: string
          unit_id: string
          invitation_code: string
          status: 'pending' | 'accepted' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          email: string
          unit_id: string
          invitation_code?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          email?: string
          unit_id?: string
          invitation_code?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone_number: string
          role: 'admin' | 'tenant'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone_number: string
          role: 'admin' | 'tenant'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone_number?: string
          role?: 'admin' | 'tenant'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
