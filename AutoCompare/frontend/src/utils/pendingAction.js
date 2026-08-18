const PENDING_KEY = 'autocompare_pending_action';

export const savePendingAction = (action) => {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
};

export const hasPendingAction = () => !!sessionStorage.getItem(PENDING_KEY);

export const clearPendingAction = () => {
  sessionStorage.removeItem(PENDING_KEY);
};

export const popPendingAction = () => {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
