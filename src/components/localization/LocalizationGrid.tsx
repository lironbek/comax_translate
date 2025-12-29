import { useState, useEffect } from 'react';
import { LocalizationRow, SUPPORTED_LANGUAGES } from '@/types/localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Pencil, Check, X, FileJson, FileSpreadsheet, Settings, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImportDialog } from './ImportDialog';
import { RowAuditLogDialog } from './RowAuditLogDialog';
import { createAuditLog } from '@/services/auditService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  id: string;
  label: string;
  type: 'fixed' | 'language';
  languageCode?: string;
}

interface LocalizationGridProps {
  data: LocalizationRow[];
  onDataChange?: (data: LocalizationRow[]) => void;
  selectedCultureCodes?: string[];
}

interface EditingState {
  resourceKey: string;
  cultureCode: string;
  value: string;
}

export function LocalizationGrid({ data, onDataChange, selectedCultureCodes = ['he-IL', 'en-US'] }: LocalizationGridProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const [columnOrder, setColumnOrder] = useState<string[]>(['key', 'resourceType']);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const { currentUser } = useCurrentUser();

  // Update column order when selected culture codes change
  useEffect(() => {
    const languageCodes = selectedCultureCodes.includes('ALL')
      ? SUPPORTED_LANGUAGES.filter(l => l.code !== 'ALL').map(l => l.code)
      : selectedCultureCodes;

    // Keep existing order for columns that still exist, add new ones at the end
    const newOrder = ['key', 'resourceType', ...languageCodes];
    setColumnOrder(prev => {
      const existingOrder = prev.filter(col => newOrder.includes(col));
      const newCols = newOrder.filter(col => !prev.includes(col));
      return [...existingOrder, ...newCols];
    });
  }, [selectedCultureCodes]);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const moveColumnUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...columnOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setColumnOrder(newOrder);
  };

  const moveColumnDown = (index: number) => {
    if (index >= columnOrder.length - 1) return;
    const newOrder = [...columnOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setColumnOrder(newOrder);
  };

  const getColumnLabel = (colId: string) => {
    if (colId === 'key') return 'Key';
    if (colId === 'resourceType') return 'Resource Type';
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === colId);
    return lang?.name || colId;
  };

  const handleEdit = (resourceKey: string, cultureCode: string, currentValue: string) => {
    setEditing({ resourceKey, cultureCode, value: currentValue });
    setEditValue(currentValue);
  };

  const handleSave = async (resourceKey: string, cultureCode: string) => {
    const row = localData.find(item => item.resourceKey === resourceKey);
    if (!row) {
      toast({
        title: 'שגיאה',
        description: 'לא נמצאה רשומה',
        variant: 'destructive',
      });
      return;
    }

    const translation = row.translations[cultureCode as keyof typeof row.translations];
    const oldValue = translation?.value || '';

    try {
      if (translation?.id) {
        // Update existing translation
        const { error: updateError } = await supabase
          .from('localization_resources')
          .update({ resource_value: editValue })
          .eq('id', translation.id);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        const newData = localData.map((item) => {
          if (item.resourceKey === resourceKey) {
            return {
              ...item,
              translations: {
                ...item.translations,
                [cultureCode]: { ...item.translations[cultureCode as keyof typeof item.translations], value: editValue },
              },
            };
          }
          return item;
        });
        
        setLocalData(newData);
        onDataChange?.(newData);

        // Create audit log
        await createAuditLog({
          username: currentUser.username,
          action_type: 'UPDATE',
          table_name: 'localization_resources',
          record_id: translation.id,
          old_value: { resource_key: resourceKey, culture_code: cultureCode, resource_value: oldValue },
          new_value: { resource_key: resourceKey, culture_code: cultureCode, resource_value: editValue },
          description: `עריכת תרגום ${cultureCode} עבור: ${resourceKey}`,
        });
      } else {
        // Create new translation
        const { data: newRecord, error: insertError } = await supabase
          .from('localization_resources')
          .insert({
            resource_type: row.resourceType,
            culture_code: cultureCode,
            resource_key: resourceKey,
            resource_value: editValue,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Update local state
        const newData = localData.map((item) => {
          if (item.resourceKey === resourceKey) {
            return {
              ...item,
              translations: {
                ...item.translations,
                [cultureCode]: { id: newRecord.id, value: editValue },
              },
            };
          }
          return item;
        });
        
        setLocalData(newData);
        onDataChange?.(newData);

        // Create audit log
        await createAuditLog({
          username: currentUser.username,
          action_type: 'CREATE',
          table_name: 'localization_resources',
          record_id: newRecord.id,
          new_value: { resource_key: resourceKey, culture_code: cultureCode, resource_value: editValue },
          description: `יצירת תרגום ${cultureCode} עבור: ${resourceKey}`,
        });
      }

      setEditing(null);
      setEditValue('');

      toast({
        title: 'התרגום עודכן',
        description: 'ערך התרגום נשמר בהצלחה.',
      });
    } catch (error) {
      console.error('Error saving to database:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את השינויים',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleImport = async (importedData: any[]) => {
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    try {
      // Import to Supabase
      for (const imported of importedData) {
        try {
          // Check if record exists
          const { data: existing } = await supabase
            .from('localization_resources')
            .select('id')
            .eq('resource_type', imported.resourceType)
            .eq('culture_code', imported.cultureCode)
            .eq('resource_key', imported.resourceKey)
            .maybeSingle();

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('localization_resources')
              .update({ resource_value: imported.resourceValue })
              .eq('id', existing.id);

            if (updateError) throw updateError;
            updatedCount++;
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('localization_resources')
              .insert({
                resource_type: imported.resourceType,
                culture_code: imported.cultureCode,
                resource_key: imported.resourceKey,
                resource_value: imported.resourceValue,
              });

            if (insertError) throw insertError;
            addedCount++;
          }
        } catch (error) {
          errors.push(`שגיאה בייבוא ${imported.resourceKey}: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
        }
      }

      // Reload data from database
      const { data: allData, error: fetchError } = await supabase
        .from('localization_resources')
        .select('*')
        .order('resource_key', { ascending: true })
        .order('culture_code', { ascending: true });

      if (!fetchError && allData) {
        // Group by resource_key
        const groupedData = new Map<string, LocalizationRow>();
        
        allData.forEach((item) => {
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

        setLocalData(resources);
        onDataChange?.(resources);
      }

      // Create audit log for import
      await createAuditLog({
        username: currentUser.username,
        action_type: 'IMPORT',
        table_name: 'localization_resources',
        new_value: { imported_count: importedData.length, added: addedCount, updated: updatedCount, errors: errors.length },
        description: `ייבוא ${importedData.length} רשומות (${addedCount} חדשות, ${updatedCount} עודכנו${errors.length > 0 ? `, ${errors.length} שגיאות` : ''})`,
      });

      if (errors.length > 0) {
        toast({
          title: 'ייבוא הושלם עם שגיאות',
          description: `יובאו ${addedCount + updatedCount} רשומות, ${errors.length} שגיאות`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'ייבוא הצליח',
          description: `יובאו ${importedData.length} רשומות (${addedCount} חדשות, ${updatedCount} עודכנו)`,
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'שגיאה בייבוא',
        description: 'לא ניתן לייבא את הנתונים',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const headers = ['Resource Key', 'Resource Type', 'he-IL', 'en-US', 'ro-RO', 'th-TH', 'ar-SA'];
    const rows = localData.map((item) => [
      item.resourceKey,
      item.resourceType,
      item.translations['he-IL']?.value || '',
      item.translations['en-US']?.value || '',
      item.translations['ro-RO']?.value || '',
      item.translations['th-TH']?.value || '',
      item.translations['ar-SA']?.value || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `localization_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'ייצוא הצליח',
      description: 'הנתונים יוצאו לקובץ Excel.',
    });
  };

  const handleExportJSON = () => {
    // Use the first selected culture code, or default to Hebrew if 'ALL' is selected
    const exportCultureCode = selectedCultureCodes.includes('ALL') ? 'he-IL' : selectedCultureCodes[0] || 'he-IL';
    const languageName = SUPPORTED_LANGUAGES.find(l => l.code === exportCultureCode)?.name || exportCultureCode;
    
    console.log(`📦 Exporting JSON for language: ${languageName} (${exportCultureCode})`);
    
    // Export with English as key and selected language as value
    const exportData = localData.map(item => ({
      key: item.translations['en-US']?.value || item.resourceKey, // English translation as key
      value: item.translations[exportCultureCode]?.value || ''     // Selected language as value
    }));
    
    console.log(`✅ Exported ${exportData.length} items`);
    console.log(`📄 Sample: ${JSON.stringify(exportData.slice(0, 2), null, 2)}`);
    
    const jsonContent = JSON.stringify(exportData, null, 4);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `localization_export_${exportCultureCode}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'ייצוא הצליח',
      description: `הנתונים יוצאו לקובץ JSON בשפה: ${languageName}`,
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            נמצאו {localData.length} {localData.length === 1 ? 'רשומה' : 'רשומות'}
          </div>
          <div className="flex gap-2">
            {/* Column Settings */}
            <Popover open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="סדר עמודות">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-3" align="end">
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-3">סדר עמודות</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    השתמש בחצים כדי לשנות את סדר העמודות
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {columnOrder.map((colId, index) => (
                      <div
                        key={colId}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{getColumnLabel(colId)}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveColumnUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveColumnDown(index)}
                            disabled={index === columnOrder.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div title="ייבוא נתונים">
              <ImportDialog onImport={handleImport} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="ייצוא נתונים">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJSON} className="gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  ייצוא ל-JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  ייצוא ל-Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columnOrder.map((colId) => {
                  if (colId === 'key') {
                    return (
                      <TableHead key={colId} className="min-w-[150px]" title="מפתח המשאב - שם קשיח בקוד">
                        Key
                      </TableHead>
                    );
                  }
                  if (colId === 'resourceType') {
                    return (
                      <TableHead key={colId} className="min-w-[120px]" title="סוג המשאב - האפליקציה">
                        Resource Type
                      </TableHead>
                    );
                  }
                  const lang = SUPPORTED_LANGUAGES.find(l => l.code === colId);
                  if (lang) {
                    return (
                      <TableHead key={colId} className="min-w-[200px]" title={`תרגום ל-${lang.name}`}>
                        {lang.name}
                      </TableHead>
                    );
                  }
                  return null;
                })}
                <TableHead className="text-left sticky left-0 bg-background z-10 min-w-[80px]" title="פעולות - ערוך את ערך התרגום">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnOrder.length + 1} className="text-center py-8 text-muted-foreground">
                    לא נמצאו רשומות. נסה לשנות את מסנני החיפוש.
                  </TableCell>
                </TableRow>
              ) : (
                localData.map((row) => (
                  <TableRow key={row.resourceKey}>
                    {columnOrder.map((colId) => {
                      if (colId === 'key') {
                        return (
                          <TableCell key={colId} className="font-mono text-sm min-w-[150px]">
                            {row.resourceKey}
                          </TableCell>
                        );
                      }
                      if (colId === 'resourceType') {
                        return (
                          <TableCell key={colId} className="text-sm text-muted-foreground min-w-[120px]">
                            {row.resourceType}
                          </TableCell>
                        );
                      }
                      const lang = SUPPORTED_LANGUAGES.find(l => l.code === colId);
                      if (lang) {
                        const translation = row.translations[lang.code as keyof typeof row.translations];
                        const isEditing = editing?.resourceKey === row.resourceKey && editing?.cultureCode === lang.code;
                        const value = translation?.value || '';

                        return (
                          <TableCell key={colId} className="min-w-[200px]">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleSave(row.resourceKey, lang.code)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <span className={!value ? 'text-muted-foreground italic' : ''}>
                                  {value || '(ריק)'}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(row.resourceKey, lang.code, value)}
                                  title={`ערוך ${lang.name}`}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        );
                      }
                      return null;
                    })}
                    <TableCell className="text-left sticky left-0 bg-background z-10">
                      <RowAuditLogDialog
                        recordId={row.resourceKey}
                        resourceKey={row.resourceKey}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </TooltipProvider>
  );
}
