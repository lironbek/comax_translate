import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs } from '@/services/auditService';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { History } from 'lucide-react';

interface AuditLogRow {
  id: string;
  username: string;
  action_type: string;
  table_name: string;
  record_id: string | null;
  description: string | null;
  created_at: string;
}

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getAuditLogs(50);
      setLogs(data as AuditLogRow[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          לוג פעילות
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">טוען...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">אין רשומות בלוג</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך ושעה</TableHead>
                  <TableHead>משתמש</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>תיאור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: he })}
                    </TableCell>
                    <TableCell className="font-medium">{log.username}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {getActionLabel(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
