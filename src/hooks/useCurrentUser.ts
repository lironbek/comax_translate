import { useState } from 'react';

// Simple mock user for demonstration - in production this would be from auth
export function useCurrentUser() {
  const [currentUser] = useState({
    id: 'demo-user-id',
    username: 'demo_admin',
    display_name: 'Demo Admin',
    role: 'admin' as const,
  });

  return { currentUser };
}
