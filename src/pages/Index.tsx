import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to localization
  if (isAuthenticated) {
    window.location.href = '/localization';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('יש להזין שם משתמש וסיסמה');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      toast.success(`ברוך הבא, ${username}!`);
      navigate('/localization');
    } else {
      toast.error(result.error || 'שגיאה בהתחברות');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <Languages className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Comax - ניהול תרגומים</CardTitle>
          <CardDescription>
            התחבר למערכת ניהול התרגומים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">שם משתמש</Label>
              <Input
                id="username"
                type="text"
                placeholder="הזן שם משתמש"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="הזן סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
