import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Pencil, Trash2, Home, Loader2, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_number: '',
  });

  const { isAuthenticated, user, logout } = useAuth();
  const { loadOrganizations: refreshOrgContext } = useOrganization();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
        .order('organization_name', { ascending: true });

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
    
    if (!formData.organization_name.trim() || !formData.organization_number.trim()) {
      toast.error('יש למלא שם ומספר ארגון');
      return;
    }

    try {
      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update({
            organization_name: formData.organization_name,
            organization_number: formData.organization_number,
          })
          .eq('id', editingOrg.id);

        if (error) throw error;
        toast.success('הארגון עודכן בהצלחה');
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert({
            organization_name: formData.organization_name,
            organization_number: formData.organization_number,
          });

        if (error) throw error;
        toast.success('הארגון נוצר בהצלחה');
      }

      setIsDialogOpen(false);
      setEditingOrg(null);
      setFormData({ organization_name: '', organization_number: '' });
      fetchOrganizations();
      refreshOrgContext(); // Refresh the context
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
      organization_name: org.organization_name,
      organization_number: org.organization_number,
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
      refreshOrgContext();
    } catch (error) {
      toast.error('שגיאה במחיקת הארגון');
      console.error('Error:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary-foreground/20">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">ניהול ארגונים</span>
            </div>

            {/* Navigation and User */}
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/localization">
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                      <Home className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>חזרה לדף הראשי</p>
                </TooltipContent>
              </Tooltip>

              {/* Separator */}
              <div className="h-6 w-px bg-primary-foreground/30" />

              {/* User Info and Logout */}
              <div className="flex items-center gap-3">
                {user && (
                  <span className="text-sm font-medium">
                    שלום, {user.displayName}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <LogOut className="h-4 w-4" />
                  יציאה
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <p className="text-muted-foreground">
              נהל את כל הארגונים במערכת
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>רשימת ארגונים</CardTitle>
                  <CardDescription>
                    כל הארגונים במערכת
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingOrg(null);
                      setFormData({ organization_name: '', organization_number: '' });
                    }}>
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
                        <Label htmlFor="organization_name">שם ארגון</Label>
                        <Input
                          id="organization_name"
                          value={formData.organization_name}
                          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                          placeholder="למשל: קומקס"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organization_number">מספר ארגון</Label>
                        <Input
                          id="organization_number"
                          value={formData.organization_number}
                          onChange={(e) => setFormData({ ...formData, organization_number: e.target.value })}
                          placeholder="למשל: 123456789"
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                </div>
              ) : organizations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  לא נמצאו ארגונים. לחץ על "הוסף ארגון" כדי להתחיל.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם ארגון</TableHead>
                      <TableHead>מספר ארגון</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-semibold">{org.organization_name}</TableCell>
                        <TableCell className="font-mono text-sm">{org.organization_number}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(org)}
                              title="ערוך"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(org.id)}
                              title="מחק"
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


