-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_code TEXT NOT NULL UNIQUE,
  application_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_fields table (fields for each application)
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

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can update applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can delete applications" ON public.applications;

DROP POLICY IF EXISTS "Anyone can view application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can insert application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can update application_fields" ON public.application_fields;
DROP POLICY IF EXISTS "Anyone can delete application_fields" ON public.application_fields;

-- RLS policies for applications
CREATE POLICY "Anyone can view applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

-- RLS policies for application_fields
CREATE POLICY "Anyone can view application_fields" ON public.application_fields FOR SELECT USING (true);
CREATE POLICY "Anyone can insert application_fields" ON public.application_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update application_fields" ON public.application_fields FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete application_fields" ON public.application_fields FOR DELETE USING (true);

-- Create triggers for automatic timestamp updates
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_fields_application_id ON public.application_fields(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_code ON public.applications(application_code);

-- Insert existing resource types as applications
INSERT INTO public.applications (application_code, application_name, description)
VALUES 
  ('SmartPhone_Picking_APP', 'אפליקציית ליקוט סמארטפון', 'אפליקציה לליקוט הזמנות במחסן'),
  ('Warehouse_Management_APP', 'אפליקציית ניהול מחסן', 'אפליקציה לניהול מחסן'),
  ('Inventory_Control_APP', 'אפליקציית בקרת מלאי', 'אפליקציה לבקרת מלאי')
ON CONFLICT (application_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.applications IS 'Applications/Interfaces in the system';
COMMENT ON TABLE public.application_fields IS 'Fields defined for each application';
COMMENT ON COLUMN public.applications.application_code IS 'Unique code for the application (used in resource_type)';
COMMENT ON COLUMN public.application_fields.field_key IS 'Unique field key within the application';

