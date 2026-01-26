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
  onResourceTypesChange?: (resourceTypes: string[]) => void;
}

export function SearchForm({ onSearch, onCultureCodesChange, onResourceTypesChange }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: 'ALL',
    cultureCode: 'ALL',
    resourceKey: '',
    resourceValue: '',
    onlyEmptyValues: false,
  });
  const [selectedCultureCodes, setSelectedCultureCodes] = useState<string[]>(['he-IL', 'en-US']);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>(['ALL']);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isResourceTypeOpen, setIsResourceTypeOpen] = useState(false);

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

  // Notify parent of initial culture codes
  useEffect(() => {
    onCultureCodesChange?.(selectedCultureCodes);
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

  const handleResourceTypeToggle = (code: string) => {
    let newTypes: string[];

    if (code === 'ALL') {
      newTypes = ['ALL'];
    } else {
      const filteredTypes = selectedResourceTypes.filter(t => t !== 'ALL');

      if (filteredTypes.includes(code)) {
        newTypes = filteredTypes.filter(t => t !== code);
        if (newTypes.length === 0) {
          newTypes = ['ALL'];
        }
      } else {
        newTypes = [...filteredTypes, code];
      }
    }

    setSelectedResourceTypes(newTypes);
    onResourceTypesChange?.(newTypes);

    const filterResourceType = newTypes.includes('ALL') ? 'ALL' : newTypes[0];
    const newFilters = { ...filters, resourceType: filterResourceType };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const getSelectedResourceTypesText = () => {
    if (selectedResourceTypes.includes('ALL')) {
      return 'כל האפליקציות';
    }
    if (selectedResourceTypes.length === 1) {
      const app = applications.find(a => a.application_code === selectedResourceTypes[0]);
      return app?.application_name || selectedResourceTypes[0];
    }
    return `${selectedResourceTypes.length} אפליקציות נבחרו`;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="resourceType" className="cursor-help">Resource Type</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>סוג המשאב - מזהה לוגי של קבוצת מחרוזות. ניתן לבחור מספר אפליקציות.</p>
                  </TooltipContent>
                </Tooltip>
                <Popover open={isResourceTypeOpen} onOpenChange={setIsResourceTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isResourceTypeOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">{getSelectedResourceTypesText()}</span>
                      <ChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-2" align="start">
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors",
                          selectedResourceTypes.includes('ALL') && "bg-muted"
                        )}
                        onClick={() => handleResourceTypeToggle('ALL')}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selectedResourceTypes.includes('ALL') ? "bg-primary border-primary text-primary-foreground" : "border-input"
                        )}>
                          {selectedResourceTypes.includes('ALL') && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm">כל האפליקציות</span>
                      </div>
                      {applications.map((app) => {
                        const isSelected = selectedResourceTypes.includes(app.application_code);
                        return (
                          <div
                            key={app.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors",
                              isSelected && "bg-muted"
                            )}
                            onClick={() => handleResourceTypeToggle(app.application_code)}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            )}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm">{app.application_name}</span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedResourceTypes.length > 0 && !selectedResourceTypes.includes('ALL') && (
                      <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                        {selectedResourceTypes.map(code => {
                          const app = applications.find(a => a.application_code === code);
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="text-xs gap-1"
                            >
                              {app?.application_name || code}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResourceTypeToggle(code);
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
                  onChange={(e) => {
                    const newFilters = { ...filters, resourceKey: e.target.value };
                    setFilters(newFilters);
                    onSearch(newFilters);
                  }}
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
                  onChange={(e) => {
                    const newFilters = { ...filters, resourceValue: e.target.value };
                    setFilters(newFilters);
                    onSearch(newFilters);
                  }}
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
                        onCheckedChange={(checked) => {
                          const newFilters = { ...filters, onlyEmptyValues: checked === true };
                          setFilters(newFilters);
                          onSearch(newFilters);
                        }}
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
