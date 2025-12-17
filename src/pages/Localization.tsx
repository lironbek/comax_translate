import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { AuditLogView } from '@/components/localization/AuditLogView';
import { SearchFilters, LocalizationResource, LocalizationRow } from '@/types/localization';
import { Languages, History, LogOut, Loader2, Code, Users, Smartphone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { translateAllHebrewToLanguages } from '@/services/translationService';

export default function Localization() {
  const [allData, setAllData] = useState<LocalizationRow[]>([]);
  const [filteredData, setFilteredData] = useState<LocalizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCultureCodes, setSelectedCultureCodes] = useState<string[]>(['ALL']);
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
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary-foreground/20">
              <Languages className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Comax - ניהול תרגומים</span>
          </div>

          {/* Navigation and User */}
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <nav className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/users">
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
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
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
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
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>אפליקציות</p>
                  </TooltipContent>
                </Tooltip>
              </nav>
            </TooltipProvider>

            {/* Separator */}
            <div className="h-6 w-px bg-primary-foreground/30" />

            {/* User Info and Logout */}
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm font-medium">
                  שלום, {user.displayName}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogOut className="h-4 w-4" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="mb-4">
          <p className="text-muted-foreground">
            ניהול תרגומים לכל האפליקציות והשפות
          </p>
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
            <div className="sticky top-14 z-40 bg-background pb-4 pt-2 -mt-2">
              <SearchForm
                onSearch={handleSearch}
                onCultureCodesChange={setSelectedCultureCodes}
              />
            </div>
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
      </div>
    </div>
  );
}
