import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { SearchFilters, SUPPORTED_LANGUAGES } from '@/types/localization';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  onCultureCodeChange?: (cultureCode: string) => void;
}

export function SearchForm({ onSearch, onCultureCodeChange }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: 'ALL',
    cultureCode: 'ALL',
    resourceKey: '',
    resourceValue: '',
    onlyEmptyValues: false,
  });
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('application_name', { ascending: true });
      
      if (!error && data) {
        setApplications(data);
      }
    };

    fetchApplications();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="resourceType" className="cursor-help">Resource Type</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>סוג המשאב - מזהה לוגי של קבוצת מחרוזות (לדוגמה: SmartPhone_Picking_APP)</p>
                  </TooltipContent>
                </Tooltip>
                <Select
                  value={filters.resourceType}
                  onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.application_code}>
                        {app.application_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="cultureCode" className="cursor-help">Culture Code (Language)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>קוד שפה - קוד השפה/אזור לפי תקן (לדוגמה: en-US, he-IL)</p>
                  </TooltipContent>
                </Tooltip>
                <Select
                  value={filters.cultureCode}
                  onValueChange={(value) => {
                    setFilters({ ...filters, cultureCode: value });
                    onCultureCodeChange?.(value);
                    // Auto-search when culture code changes
                    onSearch({ ...filters, cultureCode: value });
                  }}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="resourceKey" className="cursor-help">Resource Key</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>מפתח המשאב - שם קשיח בקוד (לדוגמה: Code_Login_Incorrect)</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="resourceKey"
                  placeholder="Search by key..."
                  value={filters.resourceKey}
                  onChange={(e) => setFilters({ ...filters, resourceKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="resourceValue" className="cursor-help">Resource Value</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ערך המשאב - הטקסט המוצג בפועל על המסך, בשפה הנבחרת</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
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
                        className={filters.cultureCode === 'ALL' ? 'text-muted-foreground cursor-help' : 'cursor-help'}
                      >
                        Show only missing translations
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>הצג רק תרגומים חסרים - מציג רק רשומות שבהן ערך התרגום ריק עבור השפה שנבחרה</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
