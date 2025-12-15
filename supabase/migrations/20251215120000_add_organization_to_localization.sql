-- Add organization_id column to localization_resources table
ALTER TABLE public.localization_resources 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_localization_resources_organization_id 
ON public.localization_resources(organization_id);

-- Update the unique constraint to include organization_id
-- First, drop the old constraint
ALTER TABLE public.localization_resources 
DROP CONSTRAINT IF EXISTS localization_resources_resource_type_culture_code_resource_key;

-- Create new unique constraint that includes organization_id
ALTER TABLE public.localization_resources 
ADD CONSTRAINT localization_resources_unique_per_org 
UNIQUE (resource_type, culture_code, resource_key, organization_id);

-- Add comment
COMMENT ON COLUMN public.localization_resources.organization_id IS 'Organization that owns this localization resource';

