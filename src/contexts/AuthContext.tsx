import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('comax_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Query the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        setIsLoading(false);
        return { success: false, error: 'שגיאה בהתחברות למסד הנתונים' };
      }

      if (!data) {
        setIsLoading(false);
        return { success: false, error: 'שם משתמש לא נמצא' };
      }

      // Simple password check (in production, use proper hashing)
      if (data.password_hash !== password) {
        setIsLoading(false);
        return { success: false, error: 'סיסמה שגויה' };
      }

      const newUser: User = {
        id: data.id,
        username: data.username,
        displayName: data.display_name || data.username,
        role: data.role,
      };
      
      setUser(newUser);
      localStorage.setItem('comax_user', JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'שגיאה לא צפויה' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('comax_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
