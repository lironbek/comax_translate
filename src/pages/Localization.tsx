import { useState } from 'react';
import { SearchForm } from '@/components/localization/SearchForm';
import { LocalizationGrid } from '@/components/localization/LocalizationGrid';
import { SearchFilters, LocalizationResource } from '@/types/localization';
import { mockLocalizationData } from '@/data/mockLocalization';
import { Languages } from 'lucide-react';

export default function Localization() {
  const [filteredData, setFilteredData] = useState<LocalizationResource[]>(mockLocalizationData);

  const handleSearch = (filters: SearchFilters) => {
    let results = [...mockLocalizationData];

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

  return (
    <div className="min-h-screen bg-background">
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

        <SearchForm onSearch={handleSearch} />
        <LocalizationGrid data={filteredData} />
      </div>
    </div>
  );
}
