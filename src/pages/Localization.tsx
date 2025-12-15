import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { AuditLogView } from '@/components/localization/AuditLogView';
import { SearchFilters, LocalizationResource, LocalizationRow } from '@/types/localization';
import { Languages, History, LogOut, Loader2, Code, Building2, Users, Globe, Smartphone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { translateAllHebrewToLanguages } from '@/services/translationService';

export default function Localization() {
  const [allData, setAllData] = useState<LocalizationRow[]>([]);
  const [filteredData, setFilteredData] = useState<LocalizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCultureCode, setSelectedCultureCode] = useState<string>('ALL');
  const { user, logout, isAuthenticated } = useAuth();
  const { selectedOrganization, setSelectedOrganization, organizations, isLoading: orgsLoading } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedOrganization) {
        setAllData([]);
        setFilteredData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('localization_resources')
          .select('*')
          .eq('organization_id', selectedOrganization.id)
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

    if (isAuthenticated && selectedOrganization) {
      fetchData();
    }
  }, [isAuthenticated, selectedOrganization]);

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

    // Filter by culture code - check if any translation exists for this culture
    if (filters.cultureCode && filters.cultureCode !== 'ALL') {
      results = results.filter((item) => {
        const translation = item.translations[filters.cultureCode as keyof typeof item.translations];
        return !!translation;
      });
    }

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

  const handleTranslateAll = async () => {
    if (!confirm('האם אתה בטוח? תרגום אוטומטי יתרגם את כל התרגומים הישירות מעברית, ועלול לשכתב תרגומים קיימים. האם להמשיך?')) {
      return;
    }

    setIsLoading(true);
    toast.info('מתחיל תרגום... זה עלול לקחת כמה דקות');

    try {
      const result = await translateAllHebrewToLanguages(['en-US', 'ro-RO', 'th-TH']);
      
      if (result.success) {
        toast.success(`תרגום הושלם בהצלחה! תורגמו ${result.translated} תרגומים`);
      } else {
        toast.warning(`תרגום הושלם עם שגיאות: ${result.translated} תורגמו, ${result.errors} שגיאות`);
        if (result.errorMessages.length > 0) {
          console.error('Translation errors:', result.errorMessages);
        }
      }

      // Reload data
      const { data, error } = await supabase
        .from('localization_resources')
        .select('*')
        .order('resource_key', { ascending: true })
        .order('culture_code', { ascending: true });

      if (!error && data) {
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
      }
    } catch (error) {
      toast.error('שגיאה בתרגום');
      console.error('Translation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* User info and logout button - floating in bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
        {user && (
          <span className="text-sm font-medium">
            שלום, {user.displayName}
          </span>
        )}
        <div className="h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="h-4 w-4" />
          יציאה
        </Button>
      </div>

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
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/organizations">
                    <Button variant="outline" size="icon">
                      <Building2 className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ארגונים</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/users">
                    <Button variant="outline" size="icon">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>משתמשים</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/api">
                    <Button variant="outline" size="icon">
                      <Code className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>API</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/applications">
                    <Button variant="outline" size="icon">
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>אפליקציות</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Organization Selector */}
        {!orgsLoading && (
          <div className="bg-card border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <label htmlFor="org-select" className="text-sm font-medium mb-2 block">
                  בחר ארגון:
                </label>
                <Select 
                  value={selectedOrganization?.id || ''} 
                  onValueChange={(value) => {
                    const org = organizations.find(o => o.id === value);
                    setSelectedOrganization(org || null);
                  }}
                >
                  <SelectTrigger id="org-select" className="w-full max-w-md">
                    <SelectValue placeholder="בחר ארגון..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.organization_name} ({org.organization_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!selectedOrganization && (
              <Alert className="mt-4">
                <AlertDescription>
                  יש לבחור ארגון כדי להציג ולערוך תרגומים
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

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
            <SearchForm 
              onSearch={handleSearch} 
              onCultureCodeChange={setSelectedCultureCode}
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
              selectedCultureCode={selectedCultureCode}
              organizationId={selectedOrganization?.id}
            />
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
