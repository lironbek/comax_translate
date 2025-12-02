export interface LocalizationResource {
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

export const SUPPORTED_LANGUAGES = [
  { code: 'ALL', name: 'All Languages' },
  { code: 'he-IL', name: 'עברית (he-IL)' },
  { code: 'en-US', name: 'English (en-US)' },
  { code: 'ro-RO', name: 'Română (ro-RO)' },
] as const;

export const RESOURCE_TYPES = [
  'SmartPhone_Picking_APP',
  'Warehouse_Management_APP',
  'Inventory_Control_APP',
] as const;
