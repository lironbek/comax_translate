import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { SearchFilters, SUPPORTED_LANGUAGES, RESOURCE_TYPES } from '@/types/localization';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: 'ALL',
    cultureCode: 'ALL',
    resourceKey: '',
    resourceValue: '',
    onlyEmptyValues: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={filters.resourceType}
                onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
              >
                <SelectTrigger id="resourceType">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cultureCode">Culture Code (Language)</Label>
              <Select
                value={filters.cultureCode}
                onValueChange={(value) => setFilters({ ...filters, cultureCode: value })}
              >
                <SelectTrigger id="cultureCode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceKey">Resource Key</Label>
              <Input
                id="resourceKey"
                placeholder="Search by key..."
                value={filters.resourceKey}
                onChange={(e) => setFilters({ ...filters, resourceKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceValue">Resource Value</Label>
              <Input
                id="resourceValue"
                placeholder="Search by value..."
                value={filters.resourceValue}
                onChange={(e) => setFilters({ ...filters, resourceValue: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyEmpty"
                checked={filters.onlyEmptyValues}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, onlyEmptyValues: checked === true })
                }
                disabled={filters.cultureCode === 'ALL'}
              />
              <Label
                htmlFor="onlyEmpty"
                className={filters.cultureCode === 'ALL' ? 'text-muted-foreground' : ''}
              >
                Show only missing translations
              </Label>
            </div>

            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
