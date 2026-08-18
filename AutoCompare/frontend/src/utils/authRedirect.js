import { hasPendingAction } from './pendingAction';

export const resolvePostAuthPath = (searchParams) => {
  const reason = searchParams?.get?.('reason');
  if (reason === 'testdrive' || hasPendingAction()) return '/';
  const next = searchParams?.get?.('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
};
