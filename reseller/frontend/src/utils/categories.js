/** Fallback if /api/products/categories is unreachable */
export const FINOS_CATEGORIES = [
  { id: 'savings', label: 'Savings', icon: '🏦' },
  { id: 'credit_card', label: 'Credit Cards', icon: '💳' },
  { id: 'personal_loan', label: 'Personal Loans', icon: '💰' },
  { id: 'health_insurance', label: 'Health Insurance', icon: '❤️' },
  { id: 'motor_insurance', label: 'Motor Insurance', icon: '🚗' },
  { id: 'life_insurance', label: 'Life / Takaful', icon: '👨‍👩‍👧' },
];

export const ALL_CATEGORY_IDS = FINOS_CATEGORIES.map((c) => c.id);

/** Encode selected ids for API market_focus column */
export function encodeCategories(ids, allIds = ALL_CATEGORY_IDS) {
  if (!ids || !ids.length) return '';
  if (allIds.length && ids.length === allIds.length) return 'all';
  return ids.join(',');
}

/** Decode market_focus string → category id list */
export function decodeCategories(marketFocus, allIds = ALL_CATEGORY_IDS) {
  if (!marketFocus || marketFocus === 'all' || marketFocus === 'All') {
    return [...allIds];
  }
  const parts = marketFocus.split(',').map((s) => s.trim()).filter(Boolean);
  const known = parts.filter((id) => allIds.includes(id));
  if (known.length) return known;
  const legacy = {
    personal: ['personal_loan'],
    mortgage: ['personal_loan'],
    auto: ['motor_insurance'],
    insurance: ['health_insurance'],
    health: ['health_insurance'],
    credit: ['credit_card'],
    life: ['life_insurance'],
    savings: ['savings'],
    Insurance: ['health_insurance'],
    Mortgage: ['personal_loan'],
  };
  return legacy[marketFocus] || [...allIds];
}

/** Fetch categories from reseller API (backed by finOS when available) */
export async function fetchMarketplaceCategories(apiClient) {
  const { data } = await apiClient.get('/products/categories');
  if (!Array.isArray(data) || !data.length) {
    return FINOS_CATEGORIES.map((c) => ({ ...c, product_count: null, source: 'default' }));
  }
  return data;
}
