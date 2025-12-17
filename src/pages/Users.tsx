import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/localization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Pencil, Trash2, Home, Loader2, Eye, Mail, Phone, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Role types with permissions
type UserRole = 'viewer' | 'editor' | 'admin';

const ROLE_PERMISSIONS = {
  viewer: {
    label: 'צפייה בלבד',
    description: 'יכול לצפות בנתונים בלבד',
    canEdit: false,
    canDelete: false,
  },
  editor: {
    label: 'מנהל הרשאה',
    description: 'יכול לצפות ולערוך נתונים',
    canEdit: true,
    canDelete: false,
  },
  admin: {
    label: 'מנהל מערכת',
    description: 'הרשאה מלאה - עריכה, מחיקה וללא הגבלה',
    canEdit: true,
    canDelete: true,
  },
} as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'viewer' as UserRole,
    is_active: true,
    notes: '',
  });
  const { isAuthenticated, user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get current user's permissions - handle legacy roles and undefined
  const currentPermissions = (() => {
    const role = currentUser?.role;
    // Handle legacy 'translator' role - map to 'editor'
    if (role === 'translator') {
      return ROLE_PERMISSIONS.editor;
    }
    // Handle valid roles
    if (role === 'admin') {
      return ROLE_PERMISSIONS.admin;
    }
    if (role === 'editor') {
      return ROLE_PERMISSIONS.editor;
    }
    if (role === 'viewer') {
      return ROLE_PERMISSIONS.viewer;
    }
    // Default to admin for logged-in users without a role (backwards compatibility)
    return ROLE_PERMISSIONS.admin;
  })();

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
    try {
      setIsLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        display_name: user.display_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: (user.role as UserRole) || 'viewer',
        is_active: user.is_active !== false,
        notes: user.notes || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        display_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'viewer',
        is_active: true,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      display_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'viewer',
      is_active: true,
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!formData.username || !formData.display_name) {
      toast.error('נא למלא את כל השדות החובה');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('נא להזין סיסמה למשתמש חדש');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          display_name: formData.display_name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
          notes: formData.notes || null,
        };

        if (formData.password) {
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
            display_name: formData.display_name,
            email: formData.email || null,
            phone: formData.phone || null,
            password_hash: formData.password,
            role: formData.role,
            is_active: formData.is_active,
            notes: formData.notes || null,
          });

        if (error) throw error;
        toast.success('המשתמש נוצר בהצלחה');
      }

      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'שגיאה בשמירת המשתמש');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      return;
    }

    try {
      const { error, count } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();

      if (error) throw error;

      // Check if any rows were actually deleted
      if (count === 0) {
        toast.error('לא ניתן למחוק את המשתמש - ייתכן שאין לך הרשאה');
        return;
      }

      toast.success('המשתמש נמחק בהצלחה');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'שגיאה במחיקת המשתמש');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'editor':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_PERMISSIONS[role as UserRole]?.label || role;
  };

  const getRoleDescription = (role: string) => {
    return ROLE_PERMISSIONS[role as UserRole]?.description || '';
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary-foreground/20">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">ניהול משתמשים</span>
          </div>

          {/* Navigation and User */}
          <div className="flex items-center gap-4">
            <TooltipProvider>
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
            </TooltipProvider>

            {/* Separator */}
            <div className="h-6 w-px bg-primary-foreground/30" />

            {/* User Info and Logout */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="text-sm font-medium">
                  שלום, {currentUser.displayName}
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
        <div className="mb-4">
          <p className="text-muted-foreground">
            ניהול משתמשים והרשאות
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>משתמשים</CardTitle>
                <CardDescription>
                  ניהול משתמשי המערכת
                </CardDescription>
                <Badge variant="outline" className="text-xs mt-1">
                  ההרשאה שלך: {getRoleLabel(currentUser?.role || 'viewer')}
                </Badge>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} className="gap-2" data-testid="add-user-button">
                    <Plus className="h-4 w-4" />
                    משתמש חדש
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'עריכת משתמש' : 'משתמש חדש'}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'עדכן את פרטי המשתמש' : 'הזן פרטי משתמש חדש'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">שם משתמש *</Label>
                        <Input
                          id="username"
                          data-testid="username-input"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="הזן שם משתמש"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">שם תצוגה *</Label>
                        <Input
                          id="display_name"
                          data-testid="display-name-input"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="הזן שם תצוגה"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">כתובת אימייל</Label>
                        <Input
                          id="email"
                          data-testid="email-input"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="example@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">טלפון</Label>
                        <Input
                          id="phone"
                          data-testid="phone-input"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="050-1234567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">סיסמה {editingUser ? '(השאר ריק כדי לא לשנות)' : '*'}</Label>
                        <Input
                          id="password"
                          data-testid="password-input"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? 'השאר ריק כדי לא לשנות' : 'הזן סיסמה'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">קבוצת הרשאה</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: UserRole) =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger id="role" data-testid="role-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer" data-testid="role-viewer">
                              <div className="flex flex-col">
                                <span className="font-medium">{ROLE_PERMISSIONS.viewer.label}</span>
                                <span className="text-xs text-muted-foreground">{ROLE_PERMISSIONS.viewer.description}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="editor" data-testid="role-editor">
                              <div className="flex flex-col">
                                <span className="font-medium">{ROLE_PERMISSIONS.editor.label}</span>
                                <span className="text-xs text-muted-foreground">{ROLE_PERMISSIONS.editor.description}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin" data-testid="role-admin">
                              <div className="flex flex-col">
                                <span className="font-medium">{ROLE_PERMISSIONS.admin.label}</span>
                                <span className="text-xs text-muted-foreground">{ROLE_PERMISSIONS.admin.description}</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">הערות</Label>
                      <Input
                        id="notes"
                        data-testid="notes-input"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="הערות נוספות..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked === true })
                        }
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">משתמש פעיל</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog} data-testid="cancel-button">
                      ביטול
                    </Button>
                    <Button onClick={handleSave} data-testid="save-user-button">
                      {editingUser ? 'עדכן' : 'צור'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם משתמש</TableHead>
                  <TableHead className="text-right">שם תצוגה</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right w-[100px]">הרשאה</TableHead>
                  <TableHead className="text-right w-[80px]">סטטוס</TableHead>
                  <TableHead className="text-left w-[150px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      אין משתמשים במערכת
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    // Handle legacy roles
                    let userRole: UserRole = 'viewer';
                    if (user.role === 'translator') {
                      userRole = 'editor';
                    } else if (user.role && user.role in ROLE_PERMISSIONS) {
                      userRole = user.role as UserRole;
                    } else if (user.role === 'admin') {
                      userRole = 'admin';
                    }

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="text-right font-medium">{user.username}</TableCell>
                        <TableCell className="text-right">{user.display_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {user.email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                  {getRoleLabel(user.role)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getRoleDescription(user.role)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.is_active !== false ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              פעיל
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 ml-1" />
                              לא פעיל
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex gap-1 justify-end">
                            {/* View Button - Always visible */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewUser(user)}
                                    data-testid={`view-user-${user.username}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>צפייה במשתמש</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {/* Edit Button */}
                            {currentPermissions.canEdit && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleOpenDialog(user)}
                                      data-testid={`edit-user-${user.username}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>עריכת משתמש</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {/* Delete Button - Only for admin */}
                            {currentPermissions.canDelete && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={() => handleDelete(user.id)}
                                      data-testid={`delete-user-${user.username}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>מחיקת משתמש (מנהל מערכת בלבד)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                פרטי משתמש
                {viewingUser && (
                  viewingUser.is_active !== false ? (
                    <Badge variant="default" className="bg-green-500">פעיל</Badge>
                  ) : (
                    <Badge variant="secondary">לא פעיל</Badge>
                  )
                )}
              </DialogTitle>
              <DialogDescription>
                צפייה בפרטי המשתמש
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">שם משתמש</Label>
                    <p className="font-medium">{viewingUser.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">שם תצוגה</Label>
                    <p className="font-medium">{viewingUser.display_name || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">כתובת אימייל</Label>
                    <p className="font-medium flex items-center gap-1">
                      {viewingUser.email ? (
                        <>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {viewingUser.email}
                        </>
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">טלפון</Label>
                    <p className="font-medium flex items-center gap-1">
                      {viewingUser.phone ? (
                        <>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {viewingUser.phone}
                        </>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">קבוצת הרשאה</Label>
                    <div className="mt-1">
                      <Badge variant={getRoleBadgeVariant(viewingUser.role)}>
                        {getRoleLabel(viewingUser.role)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">תיאור ההרשאה</Label>
                    <p className="text-sm">{getRoleDescription(viewingUser.role)}</p>
                  </div>
                </div>
                {viewingUser.notes && (
                  <div>
                    <Label className="text-muted-foreground text-sm">הערות</Label>
                    <p className="text-sm bg-muted p-2 rounded">{viewingUser.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label className="text-muted-foreground text-sm">תאריך יצירה</Label>
                    <p className="text-sm">
                      {viewingUser.created_at
                        ? new Date(viewingUser.created_at).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">עדכון אחרון</Label>
                    <p className="text-sm">
                      {viewingUser.updated_at
                        ? new Date(viewingUser.updated_at).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
                {viewingUser.last_login && (
                  <div>
                    <Label className="text-muted-foreground text-sm">התחברות אחרונה</Label>
                    <p className="text-sm">
                      {new Date(viewingUser.last_login).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                סגור
              </Button>
              {currentPermissions.canEdit && viewingUser && (
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleOpenDialog(viewingUser);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  עריכה
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
