import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  email?: string;
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
      // Query the users table to check if user exists by username OR email
      let existingUser = null;
      let queryError = null;

      // First try to find by username
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (usernameError) {
        queryError = usernameError;
      } else if (userByUsername) {
        existingUser = userByUsername;
      } else {
        // If not found by username, try by email
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', username)
          .maybeSingle();

        if (emailError) {
          queryError = emailError;
        } else {
          existingUser = userByEmail;
        }
      }

      if (queryError) {
        setIsLoading(false);
        return { success: false, error: 'שגיאה בהתחברות למסד הנתונים' };
      }

      // If user doesn't exist, return error
      if (!existingUser) {
        setIsLoading(false);
        return { success: false, error: 'שם משתמש או סיסמה שגויים' };
      }

      // Validate password
      if (existingUser.password_hash !== password) {
        setIsLoading(false);
        return { success: false, error: 'שם משתמש או סיסמה שגויים' };
      }

      // Check if user is active
      if (existingUser.is_active === false) {
        setIsLoading(false);
        return { success: false, error: 'המשתמש אינו פעיל. פנה למנהל המערכת.' };
      }

      // Update last_login timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);

      const authenticatedUser: User = {
        id: existingUser.id,
        username: existingUser.username,
        displayName: existingUser.display_name || existingUser.username,
        role: existingUser.role,
        email: existingUser.email || undefined,
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
