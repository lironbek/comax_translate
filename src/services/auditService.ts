import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AuditLogEntry {
  username: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
  table_name: string;
  record_id?: string;
  old_value?: Json;
  new_value?: Json;
  description?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert([{
    username: entry.username,
    action_type: entry.action_type,
    table_name: entry.table_name,
    record_id: entry.record_id,
    old_value: entry.old_value,
    new_value: entry.new_value,
    description: entry.description,
  }]);

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }

  return data;
}
