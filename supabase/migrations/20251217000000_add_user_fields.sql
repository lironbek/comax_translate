-- Add additional fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update role constraint to include new roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'editor', 'viewer', 'translator'));

-- Add policy for delete
CREATE POLICY IF NOT EXISTS "Admins can delete users" ON public.users FOR DELETE USING (true);
