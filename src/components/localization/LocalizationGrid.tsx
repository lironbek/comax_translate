import { useState, useEffect } from 'react';
import { LocalizationResource } from '@/types/localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Pencil, Check, X, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImportDialog } from './ImportDialog';
import { createAuditLog } from '@/services/auditService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface LocalizationGridProps {
  data: LocalizationResource[];
  onDataChange?: (data: LocalizationResource[]) => void;
}

export function LocalizationGrid({ data, onDataChange }: LocalizationGridProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleEdit = (resource: LocalizationResource) => {
    setEditingId(resource.resourceId);
    setEditValue(resource.resourceValue);
  };

  const handleSave = async (resourceId: number) => {
    const oldResource = localData.find(item => item.resourceId === resourceId);
    const newData = localData.map((item) =>
      item.resourceId === resourceId ? { ...item, resourceValue: editValue } : item
    );
    
    setLocalData(newData);
    onDataChange?.(newData);
    setEditingId(null);

    // Create audit log
    await createAuditLog({
      username: currentUser.username,
      action_type: 'UPDATE',
      table_name: 'localization_resources',
      record_id: String(resourceId),
      old_value: JSON.parse(JSON.stringify(oldResource)),
      new_value: JSON.parse(JSON.stringify({ ...oldResource, resourceValue: editValue })),
      description: `עריכת ערך תרגום: ${oldResource?.resourceKey}`,
    });

    toast({
      title: 'התרגום עודכן',
      description: 'ערך התרגום נשמר בהצלחה.',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleImport = async (importedData: LocalizationResource[]) => {
    // Merge imported data with existing data
    const mergedData = [...localData];
    let addedCount = 0;
    let updatedCount = 0;

    for (const imported of importedData) {
      const existingIndex = mergedData.findIndex(
        item => 
          item.resourceType === imported.resourceType &&
          item.cultureCode === imported.cultureCode &&
          item.resourceKey === imported.resourceKey
      );

      if (existingIndex >= 0) {
        mergedData[existingIndex] = { ...mergedData[existingIndex], resourceValue: imported.resourceValue };
        updatedCount++;
      } else {
        mergedData.push({ ...imported, resourceId: Math.max(...mergedData.map(m => m.resourceId), 0) + 1 });
        addedCount++;
      }
    }

    setLocalData(mergedData);
    onDataChange?.(mergedData);

    // Create audit log for import
    await createAuditLog({
      username: currentUser.username,
      action_type: 'IMPORT',
      table_name: 'localization_resources',
      new_value: { imported_count: importedData.length, added: addedCount, updated: updatedCount },
      description: `ייבוא ${importedData.length} רשומות (${addedCount} חדשות, ${updatedCount} עודכנו)`,
    });
  };

  const handleExport = () => {
    const headers = ['Resource Type', 'Culture Code', 'Resource Key', 'Resource Value', 'Resource ID'];
    const rows = localData.map((item) => [
      item.resourceType,
      item.cultureCode,
      item.resourceKey,
      item.resourceValue,
      item.resourceId.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
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
    const jsonContent = JSON.stringify(localData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `localization_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'ייצוא הצליח',
      description: 'הנתונים יוצאו לקובץ JSON.',
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
            <ImportDialog onImport={handleImport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  ייצוא נתונים
                  <ChevronDown className="h-3 w-3" />
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableHead className="cursor-help">סוג משאב</TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>סוג המשאב - מזהה לוגי של קבוצת מחרוזות</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableHead className="cursor-help">קוד שפה</TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>קוד שפה - קוד השפה/אזור לפי תקן</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableHead className="cursor-help">מפתח משאב</TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>מפתח המשאב - שם קשיח בקוד</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableHead className="cursor-help">ערך משאב</TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ערך המשאב - הטקסט המוצג בפועל</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableHead className="text-right cursor-help">פעולות</TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>פעולות - ערוך את ערך התרגום</p>
                  </TooltipContent>
                </Tooltip>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    לא נמצאו רשומות. נסה לשנות את מסנני החיפוש.
                  </TableCell>
                </TableRow>
              ) : (
                localData.map((resource) => (
                  <TableRow key={resource.resourceId}>
                    <TableCell className="font-medium">{resource.resourceType}</TableCell>
                    <TableCell>{resource.cultureCode}</TableCell>
                    <TableCell className="font-mono text-sm">{resource.resourceKey}</TableCell>
                    <TableCell>
                      {editingId === resource.resourceId ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="max-w-md"
                          autoFocus
                        />
                      ) : (
                        <span className={!resource.resourceValue ? 'text-muted-foreground italic' : ''}>
                          {resource.resourceValue || '(ריק)'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === resource.resourceId ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSave(resource.resourceId)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
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
