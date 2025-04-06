
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// This type defines the structure of your Supabase database
// You'll want to update this as you create tables in your Supabase project
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'tenant'
          phoneNumber: string
          createdAt: string
          updatedAt: string
          firstName?: string | null
          lastName?: string | null
          isActive?: boolean | null
          propertyId?: string | null
          unitId?: string | null
          invitationCode?: string | null
          temporaryPassword?: string | null
          hasCompletedSetup?: boolean | null
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'tenant'
          phoneNumber: string
          createdAt?: string
          updatedAt?: string
          firstName?: string | null
          lastName?: string | null
          isActive?: boolean | null
          propertyId?: string | null
          unitId?: string | null
          invitationCode?: string | null
          temporaryPassword?: string | null
          hasCompletedSetup?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'tenant'
          phoneNumber?: string
          createdAt?: string
          updatedAt?: string
          firstName?: string | null
          lastName?: string | null
          isActive?: boolean | null
          propertyId?: string | null
          unitId?: string | null
          invitationCode?: string | null
          temporaryPassword?: string | null
          hasCompletedSetup?: boolean | null
        }
      }
      properties: {
        Row: {
          id: string
          adminId: string
          name: string
          address: string
          createdAt: string
        }
        Insert: {
          id?: string
          adminId: string
          name: string
          address: string
          createdAt?: string
        }
        Update: {
          id?: string
          adminId?: string
          name?: string
          address?: string
          createdAt?: string
        }
      }
      units: {
        Row: {
          id: string
          propertyId: string
          unitNumber: string
          rentAmount: number
          status: 'occupied' | 'vacant' | 'maintenance'
          tenantId?: string | null
          leaseStartDate?: string | null
          leaseEndDate?: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          propertyId: string
          unitNumber: string
          rentAmount: number
          status: 'occupied' | 'vacant' | 'maintenance'
          tenantId?: string | null
          leaseStartDate?: string | null
          leaseEndDate?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          propertyId?: string
          unitNumber?: string
          rentAmount?: number
          status?: 'occupied' | 'vacant' | 'maintenance'
          tenantId?: string | null
          leaseStartDate?: string | null
          leaseEndDate?: string | null
          createdAt?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenantId: string
          unitId: string
          amount: number
          type: 'rent' | 'utility' | 'late_fee'
          status: 'pending' | 'completed' | 'failed'
          transactionId?: string | null
          dueDate: string
          paidAt?: string | null
          createdAt: string
          description?: string | null
        }
        Insert: {
          id?: string
          tenantId: string
          unitId: string
          amount: number
          type: 'rent' | 'utility' | 'late_fee'
          status: 'pending' | 'completed' | 'failed'
          transactionId?: string | null
          dueDate: string
          paidAt?: string | null
          createdAt?: string
          description?: string | null
        }
        Update: {
          id?: string
          tenantId?: string
          unitId?: string
          amount?: number
          type?: 'rent' | 'utility' | 'late_fee'
          status?: 'pending' | 'completed' | 'failed'
          transactionId?: string | null
          dueDate?: string
          paidAt?: string | null
          createdAt?: string
          description?: string | null
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          tenantId: string
          unitId: string
          description: string
          photoUrl?: string | null
          status: 'submitted' | 'in_progress' | 'completed'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          unitId: string
          description: string
          photoUrl?: string | null
          status: 'submitted' | 'in_progress' | 'completed'
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          unitId?: string
          description?: string
          photoUrl?: string | null
          status?: 'submitted' | 'in_progress' | 'completed'
          createdAt?: string
          updatedAt?: string
        }
      }
      move_out_requests: {
        Row: {
          id: string
          tenantId: string
          unitId: string
          moveOutDate: string
          status: 'pending' | 'approved' | 'denied'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          tenantId: string
          unitId: string
          moveOutDate: string
          status: 'pending' | 'approved' | 'denied'
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          tenantId?: string
          unitId?: string
          moveOutDate?: string
          status?: 'pending' | 'approved' | 'denied'
          createdAt?: string
          updatedAt?: string
        }
      }
      messages: {
        Row: {
          id: string
          senderId: string
          receiverId: string
          content: string
          createdAt: string
        }
        Insert: {
          id?: string
          senderId: string
          receiverId: string
          content: string
          createdAt?: string
        }
        Update: {
          id?: string
          senderId?: string
          receiverId?: string
          content?: string
          createdAt?: string
        }
      }
      announcements: {
        Row: {
          id: string
          adminId: string
          propertyId?: string | null
          content: string
          createdAt: string
          title: string
        }
        Insert: {
          id?: string
          adminId: string
          propertyId?: string | null
          content: string
          createdAt?: string
          title: string
        }
        Update: {
          id?: string
          adminId?: string
          propertyId?: string | null
          content?: string
          createdAt?: string
          title?: string
        }
      }
      documents: {
        Row: {
          id: string
          adminId: string
          tenantId?: string | null
          fileUrl: string
          name: string
          createdAt: string
        }
        Insert: {
          id?: string
          adminId: string
          tenantId?: string | null
          fileUrl: string
          name: string
          createdAt?: string
        }
        Update: {
          id?: string
          adminId?: string
          tenantId?: string | null
          fileUrl?: string
          name?: string
          createdAt?: string
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
