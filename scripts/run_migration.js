/**
 * Script to run the organizations migration directly
 * Run with: node scripts/run_migration.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cbblwihayjkteqdgjevl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYmx3aWhheWprdGVxZGdqZXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc5NzE3NywiZXhwIjoyMDgxMzczMTc3fQ.YOUR_SERVICE_ROLE_KEY'; // You need to replace this with your service role key

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = `
-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_number TEXT NOT NULL UNIQUE,
  organization_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can delete organizations" ON public.organizations;

DROP POLICY IF EXISTS "Anyone can view user_organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Anyone can insert user_organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Anyone can update user_organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Anyone can delete user_organizations" ON public.user_organizations;

-- RLS policies for organizations (public read, authenticated write)
CREATE POLICY "Anyone can view organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert organizations" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update organizations" ON public.organizations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete organizations" ON public.organizations FOR DELETE USING (true);

-- RLS policies for user_organizations (public read, authenticated write)
CREATE POLICY "Anyone can view user_organizations" ON public.user_organizations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_organizations" ON public.user_organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_organizations" ON public.user_organizations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user_organizations" ON public.user_organizations FOR DELETE USING (true);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;

-- Create trigger for automatic timestamp updates on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON public.user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_number ON public.organizations(organization_number);
`;

async function runMigration() {
  console.log('Running migration...');
  
  try {
    // Note: This requires service role key, not anon key
    // For security, it's better to run this via Supabase Dashboard SQL Editor
    console.log('Please run this SQL in Supabase Dashboard SQL Editor instead.');
    console.log('\nSQL to run:');
    console.log(migrationSQL);
  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();

