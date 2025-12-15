-- Import existing resource_keys as application fields
-- This will take all unique resource_keys from localization_resources
-- and create them as fields in the corresponding application

-- First, let's make sure we have the applications
INSERT INTO public.applications (application_code, application_name, description)
VALUES 
  ('SmartPhone_Picking_APP', 'אפליקציית ליקוט סמארטפון', 'אפליקציה לליקוט הזמנות במחסן'),
  ('Warehouse_Management_APP', 'אפליקציית ניהול מחסן', 'אפליקציה לניהול מחסן'),
  ('Inventory_Control_APP', 'אפליקציית בקרת מלאי', 'אפליקציה לבקרת מלאי')
ON CONFLICT (application_code) DO NOTHING;

-- Now import all existing resource_keys as fields
-- Group by resource_type and resource_key to get unique fields
INSERT INTO public.application_fields (application_id, field_key, field_name, is_required)
SELECT 
  a.id as application_id,
  lr.resource_key as field_key,
  -- Use the Hebrew value from he-IL as the field name, fallback to resource_key
  COALESCE(
    (SELECT resource_value 
     FROM localization_resources 
     WHERE resource_key = lr.resource_key 
       AND culture_code = 'he-IL' 
     LIMIT 1),
    lr.resource_key
  ) as field_name,
  false as is_required
FROM (
  SELECT DISTINCT resource_type, resource_key
  FROM public.localization_resources
  WHERE resource_type IN ('SmartPhone_Picking_APP', 'Warehouse_Management_APP', 'Inventory_Control_APP')
) lr
JOIN public.applications a ON a.application_code = lr.resource_type
ON CONFLICT (application_id, field_key) DO NOTHING;

-- Add a comment
COMMENT ON TABLE public.application_fields IS 'Fields imported from existing localization_resources';

