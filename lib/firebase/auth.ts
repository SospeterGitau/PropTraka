import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config';

export function useUser() {
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}
