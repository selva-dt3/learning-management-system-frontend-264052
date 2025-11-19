import { useAuth as baseUseAuth } from '../lib/auth';

/**
 * PUBLIC_INTERFACE
 * useAuth - convenience hook that re-exports the library useAuth.
 */
export function useAuth() {
  return baseUseAuth();
}
