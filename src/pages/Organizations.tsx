import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Pencil, Trash2, Home, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ organization_number: '', organization_name: '' });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    }
  }, [isAuthenticated]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('organization_number', { ascending: true });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת הארגונים');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organization_number.trim() || !formData.organization_name.trim()) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    try {
      if (editingOrg) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update({
            organization_number: formData.organization_number,
            organization_name: formData.organization_name,
          })
          .eq('id', editingOrg.id);

        if (error) throw error;
        toast.success('הארגון עודכן בהצלחה');
      } else {
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert({
            organization_number: formData.organization_number,
            organization_name: formData.organization_name,
          });

        if (error) throw error;
        toast.success('הארגון נוצר בהצלחה');
      }

      setIsDialogOpen(false);
      setEditingOrg(null);
      setFormData({ organization_number: '', organization_name: '' });
      fetchOrganizations();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('מספר ארגון כבר קיים במערכת');
      } else {
        toast.error('שגיאה בשמירת הארגון');
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      organization_number: org.organization_number,
      organization_name: org.organization_name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הארגון?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('הארגון נמחק בהצלחה');
      fetchOrganizations();
    } catch (error: any) {
      if (error.code === '23503') {
        toast.error('לא ניתן למחוק ארגון שיש לו משתמשים משויכים');
      } else {
        toast.error('שגיאה במחיקת הארגון');
        console.error('Error:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingOrg(null);
    setFormData({ organization_number: '', organization_name: '' });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto py-8 px-4 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ניהול ארגונים</h1>
                <p className="text-muted-foreground">
                  הוסף וערוך ארגונים במערכת
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/localization">
                  <Button variant="outline" size="icon">
                    <Home className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>חזרה לדף הבית</p>
              </TooltipContent>
            </Tooltip>
          </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>רשימת ארגונים</CardTitle>
                <CardDescription>
                  ניהול כל הארגונים במערכת
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleDialogClose()}>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף ארגון
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingOrg ? 'ערוך ארגון' : 'הוסף ארגון חדש'}</DialogTitle>
                    <DialogDescription>
                      {editingOrg ? 'עדכן את פרטי הארגון' : 'הזן את פרטי הארגון החדש'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="organization_number">מספר ארגון</Label>
                      <Input
                        id="organization_number"
                        value={formData.organization_number}
                        onChange={(e) => setFormData({ ...formData, organization_number: e.target.value })}
                        placeholder="הזן מספר ארגון"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization_name">שם ארגון</Label>
                      <Input
                        id="organization_name"
                        value={formData.organization_name}
                        onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        placeholder="הזן שם ארגון"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        ביטול
                      </Button>
                      <Button type="submit">
                        {editingOrg ? 'עדכן' : 'צור'}
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
                <span className="mr-2 text-muted-foreground">טוען נתונים...</span>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                לא נמצאו ארגונים. לחץ על "הוסף ארגון" כדי להתחיל.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מספר ארגון</TableHead>
                    <TableHead>שם ארגון</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.organization_number}</TableCell>
                      <TableCell>{org.organization_name}</TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(org)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(org.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}

