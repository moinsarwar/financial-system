import { hasPendingAction } from './pendingAction';

/** Where to send the user after login/register. */
export const resolvePostAuthPath = (searchParams) => {
  if (hasPendingAction()) return '/';

  const next = searchParams?.get?.('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;

  return '/dashboard';
};
