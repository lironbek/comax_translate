export interface Organization {
  id: string;
  organization_number: string;
  organization_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  organization?: Organization;
  user?: {
    id: string;
    username: string;
    display_name?: string;
  };
}

