export interface LocalizationResource {
  id?: string;
  resourceId: number;
  resourceType: string;
  cultureCode: string;
  resourceKey: string;
  resourceValue: string;
}

export interface SearchFilters {
  resourceType: string;
  cultureCode: string;
  resourceKey: string;
  resourceValue: string;
  onlyEmptyValues: boolean;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
  table_name: string;
  record_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  display_name?: string;
  role: 'admin' | 'translator' | 'viewer';
  created_at: string;
  updated_at: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ALL', name: 'All Languages' },
  { code: 'he-IL', name: 'עברית (he-IL)' },
  { code: 'en-US', name: 'English (en-US)' },
  { code: 'ro-RO', name: 'Română (ro-RO)' },
  { code: 'th-TH', name: 'ไทย (th-TH)' },
] as const;

export const RESOURCE_TYPES = [
  'SmartPhone_Picking_APP',
  'Warehouse_Management_APP',
  'Inventory_Control_APP',
] as const;
