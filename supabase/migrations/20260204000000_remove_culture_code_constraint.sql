-- Remove the culture_code constraint to allow any language
-- Languages are now managed dynamically through the languages table
ALTER TABLE public.localization_resources DROP CONSTRAINT IF EXISTS localization_resources_culture_code_check;
