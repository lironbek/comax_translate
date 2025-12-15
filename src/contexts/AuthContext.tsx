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
      // Query the users table to check if user exists
      const { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (queryError) {
        setIsLoading(false);
        return { success: false, error: 'שגיאה בהתחברות למסד הנתונים' };
      }

      let userData = existingUser;

      // If user doesn't exist, create a new user automatically
      if (!userData) {
        const { data: createdUser, error: insertError } = await supabase
          .from('users')
          .insert({
            username: username,
            password_hash: password, // Store password as-is for now (any password works)
            display_name: username,
            role: 'translator', // Default role
          })
          .select()
          .single();

        if (insertError) {
          setIsLoading(false);
          return { success: false, error: 'שגיאה ביצירת משתמש חדש' };
        }

        userData = createdUser;
      }

      // Allow login with any password (no password check)
      const authenticatedUser: User = {
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name || userData.username,
        role: userData.role,
      };
      
      setUser(authenticatedUser);
      localStorage.setItem('comax_user', JSON.stringify(authenticatedUser));
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
