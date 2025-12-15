import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  organization_number: string;
  organization_name: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  organizations: Organization[];
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('organization_name', { ascending: true });

      if (error) throw error;

      setOrganizations(data || []);
      
      // Load selected organization from localStorage
      const savedOrgId = localStorage.getItem('selected_organization_id');
      if (savedOrgId && data) {
        const savedOrg = data.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setSelectedOrganization(savedOrg);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSetSelectedOrganization = (org: Organization | null) => {
    setSelectedOrganization(org);
    if (org) {
      localStorage.setItem('selected_organization_id', org.id);
    } else {
      localStorage.removeItem('selected_organization_id');
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganization,
        setSelectedOrganization: handleSetSelectedOrganization,
        organizations,
        isLoading,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

