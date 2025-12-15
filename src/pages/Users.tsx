import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserOrganization } from '@/types/organization';
import { User } from '@/types/localization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Pencil, Trash2, Home, Loader2, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    password: '',
    role: 'translator' as 'admin' | 'translator' | 'viewer',
  });
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [allOrganizations, setAllOrganizations] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('organization_number', { ascending: true });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Fetch user-organizations relationships
      const { data: userOrgsData, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('*, organization:organizations(*)')
        .order('created_at', { ascending: false });

      if (userOrgsError) throw userOrgsError;
      setUserOrganizations(userOrgsData || []);
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserOrganizations = (userId: string): Organization[] => {
    return userOrganizations
      .filter(uo => uo.user_id === userId)
      .map(uo => uo.organization as Organization)
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error('יש להזין שם משתמש');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('יש להזין סיסמה למשתמש חדש');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          display_name: formData.display_name || null,
          role: formData.role,
        };

        if (formData.password.trim()) {
          updateData.password_hash = formData.password;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('המשתמש עודכן בהצלחה');
      } else {
        // Create new user
        const { error } = await supabase
          .from('users')
          .insert({
            username: formData.username,
            display_name: formData.display_name || null,
            password_hash: formData.password,
            role: formData.role,
          });

        if (error) throw error;
        toast.success('המשתמש נוצר בהצלחה');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', display_name: '', password: '', role: 'translator' });
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('שם משתמש כבר קיים במערכת');
      } else {
        toast.error('שגיאה בשמירת המשתמש');
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      display_name: user.display_name || '',
      password: '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('המשתמש נמחק בהצלחה');
      fetchData();
    } catch (error) {
      toast.error('שגיאה במחיקת המשתמש');
      console.error('Error:', error);
    }
  };

  const handleManageOrganizations = (user: User) => {
    setSelectedUser(user);
    const userOrgs = getUserOrganizations(user.id);
    setSelectedOrgIds(userOrgs.map(org => org.id));
    // Check if user has all organizations
    setAllOrganizations(organizations.length > 0 && userOrgs.length === organizations.length);
    setIsOrgDialogOpen(true);
  };

  const handleSaveUserOrganizations = async () => {
    if (!selectedUser) return;

    try {
      // Delete existing relationships
      const { error: deleteError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', selectedUser.id);

      if (deleteError) throw deleteError;

      // Insert new relationships
      if (selectedOrgIds.length > 0) {
        const relationships = selectedOrgIds.map(orgId => ({
          user_id: selectedUser.id,
          organization_id: orgId,
        }));

        const { error: insertError } = await supabase
          .from('user_organizations')
          .insert(relationships);

        if (insertError) throw insertError;
      }

      toast.success('הארגונים עודכנו בהצלחה');
      setIsOrgDialogOpen(false);
      setSelectedUser(null);
      setSelectedOrgIds([]);
      setAllOrganizations(false);
      fetchData();
    } catch (error) {
      toast.error('שגיאה בעדכון הארגונים');
      console.error('Error:', error);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({ username: '', display_name: '', password: '', role: 'translator' });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto py-8 px-4 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
                <p className="text-muted-foreground">
                  הוסף וערוך משתמשים ושייך אותם לארגונים
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
                <CardTitle>רשימת משתמשים</CardTitle>
                <CardDescription>
                  ניהול כל המשתמשים במערכת ושיוכם לארגונים
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleDialogClose()}>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף משתמש
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'ערוך משתמש' : 'הוסף משתמש חדש'}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'עדכן את פרטי המשתמש' : 'הזן את פרטי המשתמש החדש'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">שם משתמש</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="הזן שם משתמש"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">שם תצוגה</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="הזן שם תצוגה (אופציונלי)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        {editingUser ? 'סיסמה (השאר ריק כדי לא לשנות)' : 'סיסמה'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="הזן סיסמה"
                        required={!editingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">תפקיד</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: 'admin' | 'translator' | 'viewer') =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">מנהל</SelectItem>
                          <SelectItem value="translator">מתרגם</SelectItem>
                          <SelectItem value="viewer">צופה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        ביטול
                      </Button>
                      <Button type="submit">
                        {editingUser ? 'עדכן' : 'צור'}
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
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                לא נמצאו משתמשים. לחץ על "הוסף משתמש" כדי להתחיל.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם משתמש</TableHead>
                    <TableHead>שם תצוגה</TableHead>
                    <TableHead>תפקיד</TableHead>
                    <TableHead>ארגונים</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userOrgs = getUserOrganizations(user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.display_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'default' :
                            user.role === 'translator' ? 'secondary' : 'outline'
                          }>
                            {user.role === 'admin' ? 'מנהל' :
                             user.role === 'translator' ? 'מתרגם' : 'צופה'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userOrgs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {userOrgs.map((org) => (
                                <Badge key={org.id} variant="outline" className="gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {org.organization_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">ללא ארגונים</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageOrganizations(user)}
                              title="נהל ארגונים"
                            >
                              <Building2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog for managing user organizations */}
        <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>נהל ארגונים עבור {selectedUser?.username}</DialogTitle>
              <DialogDescription>
                בחר את הארגונים שהמשתמש יוכל לגשת אליהם
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="all-orgs"
                    checked={allOrganizations}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAllOrganizations(checked);
                      if (checked) {
                        setSelectedOrgIds(organizations.map(org => org.id));
                      } else {
                        setSelectedOrgIds([]);
                      }
                    }}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <Label htmlFor="all-orgs" className="flex-1 cursor-pointer font-bold">
                    כל הארגונים (שייך אוטומטית לכל הארגונים)
                  </Label>
                </div>
              </div>

              {/* Individual Organizations */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted/30 rounded">
                    <input
                      type="checkbox"
                      id={`org-${org.id}`}
                      checked={selectedOrgIds.includes(org.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = [...selectedOrgIds, org.id];
                          setSelectedOrgIds(newSelected);
                          // Check if all are now selected
                          if (newSelected.length === organizations.length) {
                            setAllOrganizations(true);
                          }
                        } else {
                          setSelectedOrgIds(selectedOrgIds.filter(id => id !== org.id));
                          setAllOrganizations(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                      disabled={allOrganizations}
                    />
                    <Label htmlFor={`org-${org.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{org.organization_number}</span>
                        <span>-</span>
                        <span>{org.organization_name}</span>
                      </div>
                    </Label>
                  </div>
                ))}
                {organizations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    אין ארגונים במערכת. הוסף ארגונים תחילה.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsOrgDialogOpen(false);
                setSelectedUser(null);
                setSelectedOrgIds([]);
                setAllOrganizations(false);
              }}>
                ביטול
              </Button>
              <Button onClick={handleSaveUserOrganizations}>
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </TooltipProvider>
  );
}

