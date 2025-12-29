import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { AuditLogView } from '@/components/localization/AuditLogView';
import { SearchFilters, LocalizationResource, LocalizationRow } from '@/types/localization';
import { Languages, History, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';

export default function Localization() {
  const [allData, setAllData] = useState<LocalizationRow[]>([]);
  const [filteredData, setFilteredData] = useState<LocalizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCultureCodes, setSelectedCultureCodes] = useState<string[]>(['he-IL', 'en-US']);
  const { isAuthenticated } = useAuth();
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
          .order('resource_key', { ascending: true })
          .order('culture_code', { ascending: true });

        if (error) {
          toast.error('שגיאה בטעינת הנתונים');
          console.error('Error fetching data:', error);
          return;
        }

        // Group by resource_key
        const groupedData = new Map<string, LocalizationRow>();

        (data || []).forEach((item) => {
          const key = item.resource_key;
          if (!groupedData.has(key)) {
            groupedData.set(key, {
              resourceKey: key,
              resourceType: item.resource_type,
              translations: {},
            });
          }

          const row = groupedData.get(key)!;
          row.translations[item.culture_code as keyof typeof row.translations] = {
            id: item.id,
            value: item.resource_value || '',
          };
        });

        const resources: LocalizationRow[] = Array.from(groupedData.values());

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

  const handleSearch = (filters: SearchFilters) => {
    let results = [...allData];

    // Filter by resource type
    if (filters.resourceType && filters.resourceType !== 'ALL') {
      results = results.filter((item) => item.resourceType === filters.resourceType);
    }

    // Note: Culture code filter only affects which columns are displayed (handled in LocalizationGrid)
    // It does NOT filter out records - all records are shown so users can add missing translations

    // Filter by resource key
    if (filters.resourceKey) {
      results = results.filter((item) =>
        item.resourceKey.toLowerCase().includes(filters.resourceKey.toLowerCase())
      );
    }

    // Filter by resource value - check all translations
    if (filters.resourceValue) {
      results = results.filter((item) => {
        return Object.values(item.translations).some((translation) => {
          const t = translation as { id?: string; value: string } | undefined;
          return t?.value.toLowerCase().includes(filters.resourceValue.toLowerCase());
        });
      });
    }

    // Filter only empty values - check if any translation is empty
    if (filters.onlyEmptyValues) {
      results = results.filter((item) => {
        return Object.values(item.translations).some((translation) => {
          const t = translation as { id?: string; value: string } | undefined;
          return !t?.value || t.value.trim() === '';
        });
      });
    }

    setFilteredData(results);
  };

  const handleDataChange = (newData: LocalizationRow[]) => {
    setAllData(newData);
    setFilteredData(newData);
  };

  return (
    <AppLayout title="תרגומים" description="ניהול תרגומים לכל האפליקציות והשפות">
      <Tabs defaultValue="translations" className="space-y-4">
        <div className="flex justify-start">
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
        </div>

        <TabsContent value="translations" className="space-y-4">
          <SearchForm
            onSearch={handleSearch}
            onCultureCodesChange={setSelectedCultureCodes}
          />
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2 text-muted-foreground">טוען נתונים...</span>
            </div>
          ) : (
            <LocalizationGrid
              data={filteredData}
              onDataChange={handleDataChange}
              selectedCultureCodes={selectedCultureCodes}
            />
          )}
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogView />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
