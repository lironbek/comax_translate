-- Update culture_code constraint to include Thai
ALTER TABLE public.localization_resources DROP CONSTRAINT IF EXISTS localization_resources_culture_code_check;
ALTER TABLE public.localization_resources ADD CONSTRAINT localization_resources_culture_code_check CHECK (culture_code IN ('he-IL', 'en-US', 'ro-RO', 'th-TH'));