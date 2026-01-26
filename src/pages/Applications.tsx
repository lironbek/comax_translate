import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Application, ApplicationField } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, List, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/AppLayout';

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppDialogOpen, setIsAppDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appFields, setAppFields] = useState<ApplicationField[]>([]);
  const [editingField, setEditingField] = useState<ApplicationField | null>(null);
  
  const [appFormData, setAppFormData] = useState({
    application_code: '',
    application_name: '',
    description: '',
  });

  const [fieldFormData, setFieldFormData] = useState({
    field_key: '',
    field_name: '',
    description: '',
    is_required: false,
  });

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('application_name', { ascending: true });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת האפליקציות');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppFields = async (appId: string) => {
    try {
      const { data, error } = await supabase
        .from('application_fields')
        .select('*')
        .eq('application_id', appId)
        .order('field_key', { ascending: true });

      if (error) throw error;
      setAppFields(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת השדות');
      console.error('Error:', error);
    }
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appFormData.application_code.trim() || !appFormData.application_name.trim()) {
      toast.error('יש למלא קוד ושם אפליקציה');
      return;
    }

    try {
      if (editingApp) {
        const { error } = await supabase
          .from('applications')
          .update({
            application_code: appFormData.application_code,
            application_name: appFormData.application_name,
            description: appFormData.description || null,
          })
          .eq('id', editingApp.id);

        if (error) throw error;
        toast.success('האפליקציה עודכנה בהצלחה');
      } else {
        const { error } = await supabase
          .from('applications')
          .insert({
            application_code: appFormData.application_code,
            application_name: appFormData.application_name,
            description: appFormData.description || null,
          });

        if (error) throw error;
        toast.success('האפליקציה נוצרה בהצלחה');
      }

      setIsAppDialogOpen(false);
      setEditingApp(null);
      setAppFormData({ application_code: '', application_name: '', description: '' });
      fetchApplications();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('קוד אפליקציה כבר קיים במערכת');
      } else {
        toast.error('שגיאה בשמירת האפליקציה');
        console.error('Error:', error);
      }
    }
  };

  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApp || !fieldFormData.field_key.trim() || !fieldFormData.field_name.trim()) {
      toast.error('יש למלא מפתח ושם שדה');
      return;
    }

    try {
      if (editingField) {
        const { error } = await supabase
          .from('application_fields')
          .update({
            field_key: fieldFormData.field_key,
            field_name: fieldFormData.field_name,
            description: fieldFormData.description || null,
            is_required: fieldFormData.is_required,
          })
          .eq('id', editingField.id);

        if (error) throw error;
        toast.success('השדה עודכן בהצלחה');
      } else {
        // Insert into application_fields
        const { error } = await supabase
          .from('application_fields')
          .insert({
            application_id: selectedApp.id,
            field_key: fieldFormData.field_key,
            field_name: fieldFormData.field_name,
            description: fieldFormData.description || null,
            is_required: fieldFormData.is_required,
          });

        if (error) throw error;

        // Also create initial entry in localization_resources for Hebrew
        // This ensures the key appears in the translations page
        const { error: localizationError } = await supabase
          .from('localization_resources')
          .insert({
            resource_type: selectedApp.application_code,
            culture_code: 'he-IL',
            resource_key: fieldFormData.field_key,
            resource_value: fieldFormData.field_name, // Use Hebrew name as initial value
          });

        if (localizationError) {
          // If localization insert fails (e.g., duplicate), just log it
          // The field was still created successfully
          console.warn('Note: Could not create localization entry:', localizationError);
        }

        toast.success('השדה נוסף בהצלחה');
      }

      setIsFieldDialogOpen(false);
      setEditingField(null);
      setFieldFormData({ field_key: '', field_name: '', description: '', is_required: false });
      fetchAppFields(selectedApp.id);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('מפתח שדה כבר קיים באפליקציה זו');
      } else {
        toast.error('שגיאה בשמירת השדה');
        console.error('Error:', error);
      }
    }
  };

  const handleEditApp = (app: Application) => {
    setEditingApp(app);
    setAppFormData({
      application_code: app.application_code,
      application_name: app.application_name,
      description: app.description || '',
    });
    setIsAppDialogOpen(true);
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האפליקציה? פעולה זו תמחק גם את כל השדות שלה.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('האפליקציה נמחקה בהצלחה');
      fetchApplications();
    } catch (error) {
      toast.error('שגיאה במחיקת האפליקציה');
      console.error('Error:', error);
    }
  };

  const handleManageFields = (app: Application) => {
    setSelectedApp(app);
    fetchAppFields(app.id);
  };

  const handleEditField = (field: ApplicationField) => {
    setEditingField(field);
    setFieldFormData({
      field_key: field.field_key,
      field_name: field.field_name,
      description: field.description || '',
      is_required: field.is_required,
    });
    setIsFieldDialogOpen(true);
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את השדה?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('application_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('השדה נמחק בהצלחה');
      if (selectedApp) {
        fetchAppFields(selectedApp.id);
      }
    } catch (error) {
      toast.error('שגיאה במחיקת השדה');
      console.error('Error:', error);
    }
  };

  return (
    <AppLayout title="אפליקציות" description="נהל את כל האפליקציות והשדות שלהן במערכת">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
          {/* Applications Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>רשימת אפליקציות</CardTitle>
                  <CardDescription>
                    כל האפליקציות/ממשקים במערכת
                  </CardDescription>
                </div>
                <Dialog open={isAppDialogOpen} onOpenChange={setIsAppDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingApp(null);
                      setAppFormData({ application_code: '', application_name: '', description: '' });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      הוסף אפליקציה
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingApp ? 'ערוך אפליקציה' : 'הוסף אפליקציה חדשה'}</DialogTitle>
                      <DialogDescription>
                        {editingApp ? 'עדכן את פרטי האפליקציה' : 'הזן את פרטי האפליקציה החדשה'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAppSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="app_code">קוד אפליקציה</Label>
                        <Input
                          id="app_code"
                          value={appFormData.application_code}
                          onChange={(e) => setAppFormData({ ...appFormData, application_code: e.target.value })}
                          placeholder="למשל: SmartPhone_Picking_APP"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_name">שם אפליקציה</Label>
                        <Input
                          id="app_name"
                          value={appFormData.application_name}
                          onChange={(e) => setAppFormData({ ...appFormData, application_name: e.target.value })}
                          placeholder="למשל: אפליקציית ליקוט סמארטפון"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_desc">תיאור (אופציונלי)</Label>
                        <Textarea
                          id="app_desc"
                          value={appFormData.description}
                          onChange={(e) => setAppFormData({ ...appFormData, description: e.target.value })}
                          placeholder="תיאור האפליקציה..."
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAppDialogOpen(false)}>
                          ביטול
                        </Button>
                        <Button type="submit">
                          {editingApp ? 'עדכן' : 'צור'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  לא נמצאו אפליקציות. לחץ על "הוסף אפליקציה" כדי להתחיל.
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{app.application_name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{app.application_code}</p>
                          {app.description && (
                            <p className="text-sm mt-1">{app.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageFields(app)}
                            title="נהל שדות"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditApp(app)}
                            title="ערוך"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user?.email === 'lironbe88@gmail.com' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApp(app.id)}
                              title="מחק"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fields Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedApp ? `שדות: ${selectedApp.application_name}` : 'שדות אפליקציה'}
                  </CardTitle>
                  <CardDescription>
                    {selectedApp ? 'כל השדות של האפליקציה הנבחרת' : 'בחר אפליקציה כדי לראות את השדות'}
                  </CardDescription>
                </div>
                {selectedApp && (
                  <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingField(null);
                        setFieldFormData({ field_key: '', field_name: '', description: '', is_required: false });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        הוסף שדה
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingField ? 'ערוך שדה' : 'הוסף שדה חדש'}</DialogTitle>
                        <DialogDescription>
                          {editingField ? 'עדכן את פרטי השדה' : 'הזן את פרטי השדה החדש'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleFieldSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="field_key">מפתח שדה (Key)</Label>
                          <Input
                            id="field_key"
                            value={fieldFormData.field_key}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, field_key: e.target.value })}
                            placeholder="למשל: field_message"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="field_name">שם שדה</Label>
                          <Input
                            id="field_name"
                            value={fieldFormData.field_name}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, field_name: e.target.value })}
                            placeholder="למשל: הודעה"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="field_desc">תיאור (אופציונלי)</Label>
                          <Textarea
                            id="field_desc"
                            value={fieldFormData.description}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, description: e.target.value })}
                            placeholder="תיאור השדה..."
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="is_required"
                            checked={fieldFormData.is_required}
                            onCheckedChange={(checked) => 
                              setFieldFormData({ ...fieldFormData, is_required: checked as boolean })
                            }
                          />
                          <Label htmlFor="is_required" className="cursor-pointer">
                            שדה חובה
                          </Label>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                            ביטול
                          </Button>
                          <Button type="submit">
                            {editingField ? 'עדכן' : 'צור'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedApp ? (
                <div className="text-center py-12 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  בחר אפליקציה מהרשימה מימין כדי לראות את השדות שלה
                </div>
              ) : appFields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  אין שדות לאפליקציה זו. לחץ על "הוסף שדה" כדי להתחיל.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">מפתח</TableHead>
                        <TableHead className="whitespace-nowrap">שם</TableHead>
                        <TableHead className="whitespace-nowrap">חובה</TableHead>
                        <TableHead className="text-right whitespace-nowrap">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {appFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-mono text-sm max-w-[200px] truncate" title={field.field_key}>{field.field_key}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={field.field_name}>{field.field_name}</TableCell>
                        <TableCell>
                          {field.is_required ? (
                            <Badge variant="default">חובה</Badge>
                          ) : (
                            <Badge variant="outline">אופציונלי</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField(field)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {user?.email === 'lironbe88@gmail.com' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </AppLayout>
  );
}

