import { useState } from 'react';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { AuditLogView } from '@/components/localization/AuditLogView';
import { SearchFilters, LocalizationResource } from '@/types/localization';
import { mockLocalizationData } from '@/data/mockLocalization';
import { Languages, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Localization() {
  const [allData, setAllData] = useState<LocalizationResource[]>(mockLocalizationData);
  const [filteredData, setFilteredData] = useState<LocalizationResource[]>(mockLocalizationData);

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
        <div className="flex items-center gap-3 mb-6">
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
            <LocalizationGrid data={filteredData} onDataChange={handleDataChange} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
