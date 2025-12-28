import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Plus, Pencil, Trash2, Home, Loader2, LogOut, UserCheck, UserX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    display_name: '',
    password: '',
    role: 'user',
    is_active: true,
  });

  const { isAuthenticated, user, logout } = useAuth();
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
      fetchUsers();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת המשתמשים');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('יש למלא שם משתמש ואימייל');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('יש למלא סיסמה למשתמש חדש');
      return;
    }

    try {
      if (editingUser) {
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          display_name: formData.display_name || null,
          role: formData.role,
          is_active: formData.is_active,
        };

        // Only update password if provided
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
        const { error } = await supabase
          .from('users')
          .insert({
            username: formData.username,
            email: formData.email,
            display_name: formData.display_name || null,
            password_hash: formData.password,
            role: formData.role,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('המשתמש נוצר בהצלחה');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', display_name: '', password: '', role: 'user', is_active: true });
      fetchUsers();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('שם משתמש או אימייל כבר קיים במערכת');
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
      email: user.email,
      display_name: user.display_name || '',
      password: '',
      role: user.role,
      is_active: user.is_active,
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
      fetchUsers();
    } catch (error) {
      toast.error('שגיאה במחיקת המשתמש');
      console.error('Error:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(!currentStatus ? 'המשתמש הופעל בהצלחה' : 'המשתמש הושבת בהצלחה');
      fetchUsers();
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס המשתמש');
      console.error('Error:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">מנהל</Badge>;
      case 'translator':
        return <Badge variant="secondary">מתרגם</Badge>;
      case 'user':
      default:
        return <Badge variant="outline">משתמש</Badge>;
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
                <UsersIcon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">ניהול משתמשים</span>
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
              נהל את כל המשתמשים במערכת
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>רשימת משתמשים</CardTitle>
                  <CardDescription>
                    כל המשתמשים במערכת
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingUser(null);
                      setFormData({ username: '', email: '', display_name: '', password: '', role: 'user', is_active: true });
                    }}>
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
                          placeholder="למשל: john.doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">אימייל</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="למשל: john@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">שם תצוגה (אופציונלי)</Label>
                        <Input
                          id="display_name"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="למשל: ג'ון דו"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          סיסמה {editingUser && '(השאר ריק אם לא רוצה לשנות)'}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? 'השאר ריק אם לא רוצה לשנות' : 'הזן סיסמה'}
                          required={!editingUser}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">תפקיד</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">משתמש</SelectItem>
                            <SelectItem value="translator">מתרגם</SelectItem>
                            <SelectItem value="admin">מנהל</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, is_active: checked as boolean })
                          }
                        />
                        <Label htmlFor="is_active" className="cursor-pointer">
                          משתמש פעיל
                        </Label>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                      <TableHead>אימייל</TableHead>
                      <TableHead>שם תצוגה</TableHead>
                      <TableHead>תפקיד</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                        <TableCell className="font-semibold">{u.username}</TableCell>
                        <TableCell className="font-mono text-sm">{u.email}</TableCell>
                        <TableCell>{u.display_name || '-'}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>
                          {u.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <UserCheck className="h-3 w-3" />
                              פעיל
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <UserX className="h-3 w-3" />
                              לא פעיל
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUserStatus(u.id, u.is_active)}
                                  title={u.is_active ? 'השבת משתמש' : 'הפעל משתמש'}
                                >
                                  {u.is_active ? (
                                    <UserX className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{u.is_active ? 'השבת משתמש' : 'הפעל משתמש'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(u)}
                              title="ערוך"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(u.id)}
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


