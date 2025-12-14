import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface RowAuditLogDialogProps {
  recordId: string;
  resourceKey: string;
}

interface AuditLogRow {
  id: string;
  username: string;
  action_type: string;
  description: string | null;
  created_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
}

export function RowAuditLogDialog({ recordId, resourceKey }: RowAuditLogDialogProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, recordId]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
    } else {
      setLogs(data as AuditLogRow[]);
    }
    setLoading(false);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      case 'IMPORT': return 'outline';
      default: return 'default';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'יצירה';
      case 'UPDATE': return 'עריכה';
      case 'DELETE': return 'מחיקה';
      case 'IMPORT': return 'ייבוא';
      default: return action;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="היסטוריית שינויים">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            היסטוריית שינויים: {resourceKey}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">טוען...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">אין היסטוריית שינויים לרשומה זו</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך ושעה</TableHead>
                  <TableHead>משתמש</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>ערך קודם</TableHead>
                  <TableHead>ערך חדש</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.username}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {getActionLabel(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                      {log.old_value?.resourceValue as string || '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-32 truncate">
                      {log.new_value?.resourceValue as string || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
