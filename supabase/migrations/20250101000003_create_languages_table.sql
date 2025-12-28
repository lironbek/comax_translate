-- Create languages table for managing supported languages
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100),
  direction VARCHAR(3) DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on languages" ON languages
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default languages
INSERT INTO languages (code, name, native_name, direction, is_active) VALUES
  ('he-IL', 'Hebrew', 'עברית', 'rtl', true),
  ('en-US', 'English', 'English', 'ltr', true),
  ('ro-RO', 'Romanian', 'Română', 'ltr', true),
  ('th-TH', 'Thai', 'ไทย', 'ltr', true),
  ('ar-SA', 'Arabic', 'العربية', 'rtl', true)
ON CONFLICT (code) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_languages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER languages_updated_at
  BEFORE UPDATE ON languages
  FOR EACH ROW
  EXECUTE FUNCTION update_languages_updated_at();
