
-- Create tables
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  rent_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('occupied', 'vacant', 'maintenance')),
  tenant_id UUID,
  lease_start_date TIMESTAMP WITH TIME ZONE,
  lease_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (property_id, unit_number)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rent', 'utility', 'late_fee')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.move_out_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  move_out_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  tenant_id UUID,
  file_url TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  email TEXT NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  invitation_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (email, invitation_code)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tenant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance_photos', 'maintenance_photos', true) ON CONFLICT DO NOTHING;

-- Set up storage policies
-- Documents bucket policies
CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');
  
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Only owners can update and delete documents"
  ON storage.objects USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Maintenance photos bucket policies
CREATE POLICY "Anyone can view maintenance photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'maintenance_photos');
  
CREATE POLICY "Authenticated users can upload maintenance photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'maintenance_photos' AND auth.role() = 'authenticated');

CREATE POLICY "Only owners can update and delete maintenance photos"
  ON storage.objects USING (bucket_id = 'maintenance_photos' AND auth.uid() = owner);

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_out_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Properties table policies
CREATE POLICY "Admins can manage properties"
  ON public.properties
  USING (auth.uid() = admin_id);
  
CREATE POLICY "Tenants can view properties they occupy"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.units
      WHERE units.property_id = properties.id
      AND units.tenant_id = auth.uid()
    )
  );

-- Units table policies
CREATE POLICY "Admins can manage units"
  ON public.units
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = units.property_id
      AND properties.admin_id = auth.uid()
    )
  );
  
CREATE POLICY "Tenants can view their units"
  ON public.units FOR SELECT
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = units.property_id
      AND properties.admin_id = auth.uid()
    )
  );

-- Payments table policies
CREATE POLICY "Admins can manage payments"
  ON public.payments
  USING (
    EXISTS (
      SELECT 1 FROM public.units
      JOIN public.properties ON units.property_id = properties.id
      WHERE units.id = payments.unit_id
      AND properties.admin_id = auth.uid()
    )
  );
  
CREATE POLICY "Tenants can manage their own payments"
  ON public.payments
  USING (tenant_id = auth.uid());

-- Maintenance requests table policies
CREATE POLICY "Admins can manage maintenance requests"
  ON public.maintenance_requests
  USING (
    EXISTS (
      SELECT 1 FROM public.units
      JOIN public.properties ON units.property_id = properties.id
      WHERE units.id = maintenance_requests.unit_id
      AND properties.admin_id = auth.uid()
    )
  );
  
CREATE POLICY "Tenants can manage their own maintenance requests"
  ON public.maintenance_requests
  USING (tenant_id = auth.uid());

-- Move out requests table policies
CREATE POLICY "Admins can manage move out requests"
  ON public.move_out_requests
  USING (
    EXISTS (
      SELECT 1 FROM public.units
      JOIN public.properties ON units.property_id = properties.id
      WHERE units.id = move_out_requests.unit_id
      AND properties.admin_id = auth.uid()
    )
  );
  
CREATE POLICY "Tenants can manage their own move out requests"
  ON public.move_out_requests
  USING (tenant_id = auth.uid());

-- Messages table policies
CREATE POLICY "Users can manage messages they're involved in"
  ON public.messages
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Announcements table policies
CREATE POLICY "Admins can manage announcements"
  ON public.announcements
  USING (admin_id = auth.uid());
  
CREATE POLICY "Everyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

-- Documents table policies
CREATE POLICY "Admins can manage documents"
  ON public.documents
  USING (admin_id = auth.uid());
  
CREATE POLICY "Tenants can view their documents"
  ON public.documents FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Tenant invitations table policies
CREATE POLICY "Admins can manage invitations"
  ON public.tenant_invitations
  USING (admin_id = auth.uid());
  
CREATE POLICY "Anyone can read invitations by email"
  ON public.tenant_invitations FOR SELECT
  USING (true);

-- Profiles table policies
CREATE POLICY "Users can manage their own profiles"
  ON public.profiles
  USING (user_id = auth.uid());
  
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
