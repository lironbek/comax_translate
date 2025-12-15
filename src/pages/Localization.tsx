import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { AuditLogView } from '@/components/localization/AuditLogView';
import { SearchFilters, LocalizationResource } from '@/types/localization';
import { Languages, History, LogOut, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Localization() {
  const [allData, setAllData] = useState<LocalizationResource[]>([]);
  const [filteredData, setFilteredData] = useState<LocalizationResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('localization_resources')
          .select('*')
          .order('resource_key', { ascending: true });

        if (error) {
          toast.error('שגיאה בטעינת הנתונים');
          console.error('Error fetching data:', error);
          return;
        }

        const resources: LocalizationResource[] = (data || []).map((item, index) => ({
          id: item.id,
          resourceId: index + 1,
          resourceType: item.resource_type,
          cultureCode: item.culture_code,
          resourceKey: item.resource_key,
          resourceValue: item.resource_value || '',
        }));

        setAllData(resources);
        setFilteredData(resources);
      } catch (err) {
        toast.error('שגיאה בטעינת הנתונים');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (filters: SearchFilters) => {
    let results = [...allData];

    // Filter by resource type
    if (filters.resourceType && filters.resourceType !== 'ALL') {
      results = results.filter((item) => item.resourceType === filters.resourceType);
    }

    // Filter by culture code
    if (filters.cultureCode && filters.cultureCode !== 'ALL') {
      results = results.filter((item) => item.cultureCode === filters.cultureCode);
    }

    // Filter by resource key
    if (filters.resourceKey) {
      results = results.filter((item) =>
        item.resourceKey.toLowerCase().includes(filters.resourceKey.toLowerCase())
      );
    }

    // Filter by resource value
    if (filters.resourceValue) {
      results = results.filter((item) =>
        item.resourceValue.toLowerCase().includes(filters.resourceValue.toLowerCase())
      );
    }

    // Filter only empty values
    if (filters.onlyEmptyValues) {
      results = results.filter((item) => !item.resourceValue || item.resourceValue.trim() === '');
    }

    setFilteredData(results);
  };

  const handleDataChange = (newData: LocalizationResource[]) => {
    setAllData(newData);
    setFilteredData(newData);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Languages className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Comax - ניהול תרגומים</h1>
              <p className="text-muted-foreground">
                ניהול תרגומים לכל האפליקציות והשפות
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground">
                שלום, {user.displayName}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              יציאה
            </Button>
          </div>
        </div>

        <Tabs defaultValue="translations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="translations" className="gap-2">
              <Languages className="h-4 w-4" />
              תרגומים
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              לוג פעילות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translations" className="space-y-4">
            <SearchForm onSearch={handleSearch} />
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mr-2 text-muted-foreground">טוען נתונים...</span>
              </div>
            ) : (
              <LocalizationGrid data={filteredData} onDataChange={handleDataChange} />
            )}
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
