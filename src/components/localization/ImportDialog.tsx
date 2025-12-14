import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { LocalizationResource } from '@/types/localization';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
  onImport: (data: LocalizationResource[]) => void;
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importedData, setImportedData] = useState<LocalizationResource[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setImportedData(null);
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateData = (data: unknown[]): LocalizationResource[] => {
    const validated: LocalizationResource[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, unknown>;
      
      // Map common column names from Excel
      const resourceType = item.resourceType || item['Resource Type'] || item.resource_type;
      const cultureCode = item.cultureCode || item['Culture Code'] || item.culture_code;
      const resourceKey = item.resourceKey || item['Resource Key'] || item.resource_key;
      const resourceValue = item.resourceValue || item['Resource Value'] || item.resource_value || '';
      const resourceId = item.resourceId || item['Resource ID'] || item.resource_id || i + 1;

      if (!resourceType || !cultureCode || !resourceKey) {
        throw new Error(`שורה ${i + 1}: חסרים שדות חובה (resourceType, cultureCode, resourceKey)`);
      }

      // Validate culture code
      const validCultures = ['he-IL', 'en-US', 'ro-RO'];
      if (!validCultures.includes(String(cultureCode))) {
        throw new Error(`שורה ${i + 1}: קוד שפה לא תקין "${cultureCode}". ערכים תקינים: ${validCultures.join(', ')}`);
      }

      validated.push({
        resourceId: Number(resourceId),
        resourceType: String(resourceType),
        cultureCode: String(cultureCode),
        resourceKey: String(resourceKey),
        resourceValue: String(resourceValue),
      });
    }

    return validated;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const data = Array.isArray(jsonData) ? jsonData : [jsonData];
        const validated = validateData(data);
        setImportedData(validated);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const validated = validateData(jsonData);
        setImportedData(validated);
      } else {
        throw new Error('סוג קובץ לא נתמך. השתמש ב-JSON, Excel (.xlsx, .xls) או CSV.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
      setImportedData(null);
    }
  };

  const handleConfirmImport = () => {
    if (importedData) {
      onImport(importedData);
      setIsOpen(false);
      resetState();
      toast({
        title: 'ייבוא הצליח',
        description: `יובאו ${importedData.length} רשומות בהצלחה.`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          ייבוא נתונים
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבוא נתוני תרגום</DialogTitle>
          <DialogDescription>
            בחר קובץ JSON או Excel לייבוא. הקובץ צריך להכיל את השדות: resourceType, cultureCode, resourceKey, resourceValue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              JSON
            </div>
            <div className="flex items-center gap-1">
              <FileSpreadsheet className="h-4 w-4" />
              Excel / CSV
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              cursor-pointer"
          />

          {fileName && (
            <div className="text-sm">
              <span className="text-muted-foreground">קובץ נבחר: </span>
              <span className="font-medium">{fileName}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importedData && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>נמצאו {importedData.length} רשומות תקינות לייבוא</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setIsOpen(false); resetState(); }}>
            ביטול
          </Button>
          <Button onClick={handleConfirmImport} disabled={!importedData}>
            אישור ייבוא
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
