export interface Application {
  id: string;
  application_code: string;
  application_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationField {
  id: string;
  application_id: string;
  field_key: string;
  field_name: string;
  description: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

