
-- Create tables based on database.types.ts

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tenant')),
  phoneNumber TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  isActive BOOLEAN DEFAULT true,
  propertyId UUID,
  unitId UUID,
  invitationCode TEXT,
  temporaryPassword TEXT,
  hasCompletedSetup BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adminId UUID NOT NULL REFERENCES public.users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Units table
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propertyId UUID NOT NULL REFERENCES public.properties(id),
  unitNumber TEXT NOT NULL,
  rentAmount DECIMAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('occupied', 'vacant', 'maintenance')),
  tenantId UUID REFERENCES public.users(id),
  leaseStartDate TIMESTAMP WITH TIME ZONE,
  leaseEndDate TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES public.users(id),
  unitId UUID NOT NULL REFERENCES public.units(id),
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rent', 'utility', 'late_fee')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  transactionId TEXT,
  dueDate TIMESTAMP WITH TIME ZONE NOT NULL,
  paidAt TIMESTAMP WITH TIME ZONE,
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES public.users(id),
  unitId UUID NOT NULL REFERENCES public.units(id),
  description TEXT NOT NULL,
  photoUrl TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'in_progress', 'completed')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Move out requests table
CREATE TABLE IF NOT EXISTS public.move_out_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantId UUID NOT NULL REFERENCES public.users(id),
  unitId UUID NOT NULL REFERENCES public.units(id),
  moveOutDate TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senderId UUID NOT NULL REFERENCES public.users(id),
  receiverId UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adminId UUID NOT NULL REFERENCES public.users(id),
  propertyId UUID REFERENCES public.properties(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adminId UUID NOT NULL REFERENCES public.users(id),
  tenantId UUID REFERENCES public.users(id),
  fileUrl TEXT NOT NULL,
  name TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_out_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for properties table
CREATE POLICY "Admins can manage their own properties" ON public.properties
  USING (adminId = auth.uid());

CREATE POLICY "Tenants can view their property" ON public.properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'tenant' 
      AND propertyId = properties.id
    )
  );

-- Create function to check if a user is the admin of a property
CREATE OR REPLACE FUNCTION public.is_property_admin(property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id AND adminId = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Define additional RLS policies for other tables as needed
