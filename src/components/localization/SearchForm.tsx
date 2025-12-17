import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { SearchFilters, SUPPORTED_LANGUAGES } from '@/types/localization';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  onCultureCodesChange?: (cultureCodes: string[]) => void;
}

export function SearchForm({ onSearch, onCultureCodesChange }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: 'ALL',
    cultureCode: 'ALL',
    resourceKey: '',
    resourceValue: '',
    onlyEmptyValues: false,
  });
  const [selectedCultureCodes, setSelectedCultureCodes] = useState<string[]>(['ALL']);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

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

  const handleCultureCodeToggle = (code: string) => {
    let newCodes: string[];

    if (code === 'ALL') {
      newCodes = ['ALL'];
    } else {
      // Remove 'ALL' if selecting specific language
      const filteredCodes = selectedCultureCodes.filter(c => c !== 'ALL');

      if (filteredCodes.includes(code)) {
        // Remove the code
        newCodes = filteredCodes.filter(c => c !== code);
        // If no codes left, default to 'ALL'
        if (newCodes.length === 0) {
          newCodes = ['ALL'];
        }
      } else {
        // Add the code
        newCodes = [...filteredCodes, code];
      }
    }

    setSelectedCultureCodes(newCodes);
    onCultureCodesChange?.(newCodes);

    // Update filters for search
    const filterCultureCode = newCodes.includes('ALL') ? 'ALL' : newCodes[0];
    const newFilters = { ...filters, cultureCode: filterCultureCode };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const getSelectedLanguagesText = () => {
    if (selectedCultureCodes.includes('ALL')) {
      return 'כל השפות';
    }
    if (selectedCultureCodes.length === 1) {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === selectedCultureCodes[0]);
      return lang?.name || selectedCultureCodes[0];
    }
    return `${selectedCultureCodes.length} שפות נבחרו`;
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
                    <p>קוד שפה - קוד השפה/אזור לפי תקן (לדוגמה: en-US, he-IL). ניתן לבחור מספר שפות.</p>
                  </TooltipContent>
                </Tooltip>
                <Popover open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isLanguageOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">{getSelectedLanguagesText()}</span>
                      <ChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-2" align="start">
                    <div className="space-y-1">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = selectedCultureCodes.includes(lang.code);
                        return (
                          <div
                            key={lang.code}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors",
                              isSelected && "bg-muted"
                            )}
                            onClick={() => handleCultureCodeToggle(lang.code)}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            )}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm">{lang.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedCultureCodes.length > 0 && !selectedCultureCodes.includes('ALL') && (
                      <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                        {selectedCultureCodes.map(code => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="text-xs gap-1"
                            >
                              {lang?.code || code}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCultureCodeToggle(code);
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
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
                      />
                      <Label
                        htmlFor="onlyEmpty"
                        className="cursor-help"
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
