-- ========================================
-- מריצים את כל ה-Migrations בסדר על הפרויקט החדש
-- cbblwihayjkteqdgjevl
-- ========================================

-- הריצה צריכה להיות ב-Supabase Dashboard > SQL Editor
-- העתק והדבק את כל הקובץ הזה ולחץ RUN

-- ========================================
-- Migration 1: Create base tables
-- ========================================

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer', 'translator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create localization_resources table
CREATE TABLE IF NOT EXISTS public.localization_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  culture_code TEXT NOT NULL CHECK (culture_code IN ('he-IL', 'en-US', 'ro-RO', 'th-TH')),
  resource_key TEXT NOT NULL,
  resource_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_type, culture_code, resource_key)
);

-- Create audit_logs table for tracking all changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  username TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'IMPORT')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_code TEXT NOT NULL UNIQUE,
  application_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_fields table
CREATE TABLE IF NOT EXISTS public.application_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, field_key)
);

-- ========================================
-- Enable RLS
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fields ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies
-- ========================================

-- Users policies
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

CREATE POLICY "Anyone can view users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (true);

-- Localization resources policies
DROP POLICY IF EXISTS "Anyone can view resources" ON public.localization_resources;
DROP POLICY IF EXISTS "Anyone can insert resources" ON public.localization_resources;
DROP POLICY IF EXISTS "Anyone can update resources" ON public.localization_resources;
DROP POLICY IF EXISTS "Anyone can delete resources" ON public.localization_resources;

CREATE POLICY "Anyone can view resources" ON public.localization_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert resources" ON public.localization_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update resources" ON public.localization_resources FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete resources" ON public.localization_resources FOR DELETE USING (true);

-- Audit logs policies
DROP POLICY IF EXISTS "Anyone can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;

CREATE POLICY "Anyone can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Applications policies
DROP POLICY IF EXISTS "Anyone can view applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can update applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can delete applications" ON public.applications;

CREATE POLICY "Anyone can view applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

-- Application fields policies
DROP POLICY IF EXISTS "Anyone can view application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can insert application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can update application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can delete application_fields" ON public.application_fields;

CREATE POLICY "Anyone can view application_fields" ON public.application_fields FOR SELECT USING (true);
CREATE POLICY "Anyone can insert application_fields" ON public.application_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update application_fields" ON public.application_fields FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete application_fields" ON public.application_fields FOR DELETE USING (true);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_localization_resources_updated_at ON public.localization_resources;
CREATE TRIGGER update_localization_resources_updated_at
  BEFORE UPDATE ON public.localization_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_fields_updated_at ON public.application_fields;
CREATE TRIGGER update_application_fields_updated_at
  BEFORE UPDATE ON public.application_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Insert default applications
-- ========================================

INSERT INTO public.applications (application_code, application_name, description)
VALUES 
  ('SmartPhone_Picking_APP', 'אפליקציית ליקוט סמארטפון', 'אפליקציה לליקוט הזמנות במחסן'),
  ('Warehouse_Management_APP', 'אפליקציית ניהול מחסן', 'אפליקציה לניהול מחסן'),
  ('Inventory_Control_APP', 'אפליקציית בקרת מלאי', 'אפליקציה לבקרת מלאי')
ON CONFLICT (application_code) DO NOTHING;

-- ========================================
-- Create indexes for better performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_localization_resources_type_culture 
ON public.localization_resources(resource_type, culture_code);

CREATE INDEX IF NOT EXISTS idx_localization_resources_key 
ON public.localization_resources(resource_key);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
ON public.audit_logs(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_fields_application_id 
ON public.application_fields(application_id);

CREATE INDEX IF NOT EXISTS idx_applications_code 
ON public.applications(application_code);

-- ========================================
-- הצלחה! כל הטבלאות נוצרו
-- ========================================
SELECT 'Migration completed successfully! ✅' as status;

