import { useAuth } from '@/contexts/AuthContext';

// Use auth context for current user
export function useCurrentUser() {
  const { user } = useAuth();
  
  const currentUser = {
    id: 'user-id',
    username: user?.username || 'anonymous',
    display_name: user?.displayName || 'Anonymous',
    role: 'admin' as const,
  };

  return { currentUser };
}
