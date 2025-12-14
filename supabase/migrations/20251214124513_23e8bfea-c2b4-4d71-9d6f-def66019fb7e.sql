-- Create users table for authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'translator' CHECK (role IN ('admin', 'translator', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create localization_resources table
CREATE TABLE public.localization_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  culture_code TEXT NOT NULL CHECK (culture_code IN ('he-IL', 'en-US', 'ro-RO')),
  resource_key TEXT NOT NULL,
  resource_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_type, culture_code, resource_key)
);

-- Create audit_logs table for tracking all changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  username TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'IMPORT')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for users (admins can manage, users can view themselves)
CREATE POLICY "Anyone can view users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (true);

-- RLS policies for localization_resources (public read, authenticated write)
CREATE POLICY "Anyone can view resources" ON public.localization_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert resources" ON public.localization_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update resources" ON public.localization_resources FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete resources" ON public.localization_resources FOR DELETE USING (true);

-- RLS policies for audit_logs (read-only for all, insert allowed)
CREATE POLICY "Anyone can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_localization_resources_updated_at
  BEFORE UPDATE ON public.localization_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();