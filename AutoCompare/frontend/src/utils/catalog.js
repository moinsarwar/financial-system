export const CHINESE_MFGS = ['byd', 'changan', 'haval', 'mg', 'chery', 'gwm'];

export const BRAND_STYLES = {
  toyota: { initial: 'T', color: '#c8102e' },
  honda: { initial: 'H', color: '#e40521' },
  suzuki: { initial: 'S', color: '#1d4e89' },
  hyundai: { initial: 'H', color: '#002c5f' },
  kia: { initial: 'K', color: '#05141f' },
  isuzu: { initial: 'I', color: '#ed1c24' },
  byd: { initial: 'B', color: '#1a6b45' },
  changan: { initial: 'C', color: '#0b4f6c' },
  haval: { initial: 'H', color: '#b42318' },
  mg: { initial: 'MG', color: '#8b1538' },
  chery: { initial: 'C', color: '#c81e1e' },
  gwm: { initial: 'G', color: '#1a4d8c' },
};

export const getBrandStyle = (mfg) =>
  BRAND_STYLES[(mfg || '').toLowerCase()] || { initial: (mfg || 'A').slice(0, 1).toUpperCase(), color: '#0b4f6c' };

export const MANUFACTURERS = [
  { id: 'toyota', label: 'Toyota', hint: 'JP · PK' },
  { id: 'honda', label: 'Honda', hint: 'JP · PK' },
  { id: 'suzuki', label: 'Suzuki', hint: 'JP · PK' },
  { id: 'hyundai', label: 'Hyundai', hint: 'KR · PK' },
  { id: 'kia', label: 'Kia', hint: 'KR · PK' },
  { id: 'isuzu', label: 'Isuzu', hint: 'JP' },
  { id: 'byd', label: 'BYD', hint: 'CN · EV' },
  { id: 'changan', label: 'Changan', hint: 'CN' },
  { id: 'haval', label: 'Haval', hint: 'CN · SUV' },
  { id: 'mg', label: 'MG', hint: 'CN · UK' },
  { id: 'chery', label: 'Chery', hint: 'CN' },
  { id: 'gwm', label: 'GWM', hint: 'CN · SUV' },
];

export const ORIGIN_TITLES = {
  all: 'All Vehicles',
  assembled: 'Assembled in Pakistan',
  imported: 'Imported Vehicles',
  chinese: 'Chinese Brands',
};

export const COST_PROVENANCE =
  'Based on 15,000 km/year · Petrol PKR 270/L, Diesel PKR 280/L, Electricity PKR 45/kWh · Maintenance, insurance, registration and depreciation are estimates for demonstration purposes.';
