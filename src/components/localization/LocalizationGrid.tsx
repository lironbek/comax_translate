import { useState } from 'react';
import { LocalizationResource } from '@/types/localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Download, Pencil, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocalizationGridProps {
  data: LocalizationResource[];
}

export function LocalizationGrid({ data }: LocalizationGridProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);

  const handleEdit = (resource: LocalizationResource) => {
    setEditingId(resource.resourceId);
    setEditValue(resource.resourceValue);
  };

  const handleSave = (resourceId: number) => {
    setLocalData((prev) =>
      prev.map((item) =>
        item.resourceId === resourceId ? { ...item, resourceValue: editValue } : item
      )
    );
    setEditingId(null);
    toast({
      title: 'Translation updated',
      description: 'The resource value has been saved successfully.',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
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
      title: 'Export successful',
      description: 'Localization data has been exported to CSV.',
    });
  };

  return (
    <Card>
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Found {localData.length} {localData.length === 1 ? 'record' : 'records'}
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Type</TableHead>
              <TableHead>Culture Code</TableHead>
              <TableHead>Resource Key</TableHead>
              <TableHead>Resource Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No records found. Try adjusting your search filters.
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
                        {resource.resourceValue || '(empty)'}
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
  );
}
