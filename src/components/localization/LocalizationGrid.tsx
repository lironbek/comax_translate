import { useState, useEffect } from 'react';
import { LocalizationRow, SUPPORTED_LANGUAGES } from '@/types/localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Pencil, Check, X, FileJson, FileSpreadsheet, ChevronDown, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImportDialog } from './ImportDialog';
import { RowAuditLogDialog } from './RowAuditLogDialog';
import { createAuditLog } from '@/services/auditService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

interface LocalizationGridProps {
  data: LocalizationRow[];
  onDataChange?: (data: LocalizationRow[]) => void;
  selectedCultureCode?: string;
  organizationId?: string;
}

interface EditingState {
  resourceKey: string;
  cultureCode: string;
  value: string;
}

export function LocalizationGrid({ data, onDataChange, selectedCultureCode, organizationId }: LocalizationGridProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    setLocalData(data);
  }, [data]);

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
        if (!organizationId) {
          throw new Error('חובה לבחור ארגון');
        }

        const { data: newRecord, error: insertError } = await supabase
          .from('localization_resources')
          .insert({
            resource_type: row.resourceType,
            culture_code: cultureCode,
            resource_key: resourceKey,
            resource_value: editValue,
            organization_id: organizationId,
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
            if (!organizationId) {
              throw new Error('חובה לבחור ארגון');
            }

            const { error: insertError } = await supabase
              .from('localization_resources')
              .insert({
                resource_type: imported.resourceType,
                culture_code: imported.cultureCode,
                resource_key: imported.resourceKey,
                resource_value: imported.resourceValue,
                organization_id: organizationId,
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
    const headers = ['Resource Key', 'Resource Type', 'he-IL', 'en-US', 'ro-RO', 'th-TH'];
    const rows = localData.map((item) => [
      item.resourceKey,
      item.resourceType,
      item.translations['he-IL']?.value || '',
      item.translations['en-US']?.value || '',
      item.translations['ro-RO']?.value || '',
      item.translations['th-TH']?.value || '',
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
    // Use the selected culture code, or default to Hebrew if 'ALL' is selected
    const exportCultureCode = selectedCultureCode === 'ALL' ? 'he-IL' : selectedCultureCode;
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

  // Filter languages based on selected culture code
  // Always show Hebrew (he-IL) + selected language (if not Hebrew)
  const languages = selectedCultureCode && selectedCultureCode !== 'ALL'
    ? SUPPORTED_LANGUAGES.filter(l => l.code === 'he-IL' || l.code === selectedCultureCode)
    : SUPPORTED_LANGUAGES.filter(l => l.code !== 'ALL');

  return (
    <TooltipProvider>
      <Card>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            נמצאו {localData.length} {localData.length === 1 ? 'רשומה' : 'רשומות'}
          </div>
          <div className="flex gap-2">
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
                <TableHead className="sticky right-0 bg-background z-10" title="מפתח המשאב - שם קשיח בקוד">
                  Key
                </TableHead>
                {languages.map((lang) => (
                  <TableHead key={lang.code} className="min-w-[350px]" title={`תרגום ל-${lang.name}`}>
                    {lang.name}
                  </TableHead>
                ))}
                <TableHead className="text-right sticky left-0 bg-background z-10" title="פעולות - ערוך את ערך התרגום">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={languages.length + 2} className="text-center py-8 text-muted-foreground">
                    לא נמצאו רשומות. נסה לשנות את מסנני החיפוש.
                  </TableCell>
                </TableRow>
              ) : (
                localData.map((row) => (
                  <TableRow key={row.resourceKey}>
                    <TableCell className="font-mono text-sm sticky right-0 bg-background z-10">
                      {row.resourceKey}
                    </TableCell>
                    {languages.map((lang) => {
                      const translation = row.translations[lang.code as keyof typeof row.translations];
                      const isEditing = editing?.resourceKey === row.resourceKey && editing?.cultureCode === lang.code;
                      const value = translation?.value || '';
                      
                      return (
                        <TableCell key={lang.code} className="min-w-[350px]">
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
                    })}
                    <TableCell className="text-right sticky left-0 bg-background z-10">
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
