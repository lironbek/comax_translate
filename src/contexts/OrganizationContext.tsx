import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Organization {
  id: string;
  organization_name: string;
  organization_number: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization | null) => void;
  setSelectedOrganization: (org: Organization | null) => void;
  loadOrganizations: () => Promise<void>;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(() => {
    const stored = localStorage.getItem('comax_current_org');
    return stored ? JSON.parse(stored) : null;
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, organization_name, organization_number')
        .order('organization_name');

      if (error) {
        console.error('Error loading organizations:', error);
        setOrganizations([]);
      } else {
        setOrganizations(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading organizations:', err);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganization(org);
    if (org) {
      localStorage.setItem('comax_current_org', JSON.stringify(org));
    } else {
      localStorage.removeItem('comax_current_org');
    }
  };

  // Load organizations when user logs in
  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
    }
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        selectedOrganization: currentOrganization, // Alias for compatibility
        organizations,
        setCurrentOrganization: handleSetCurrentOrganization,
        setSelectedOrganization: handleSetCurrentOrganization, // Alias for compatibility
        loadOrganizations,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}


