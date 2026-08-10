import type { CSSProperties, ReactNode } from 'react';
import type { Product, ProductFormData } from '../../types';
import Button from '../Common/Button';

export const emptyProductForm: ProductFormData = {
  name: '',
  price: 0,
  category: '',
  type: 'financed',
  description: '',
  saving_factor_electric: 0,
  saving_factor_fuel: 0,
  warranty: null,
  installation: null,
  monthly_saving: 0,
  annual_saving: 0,
  payback: null,
  rating: 4.5,
};

export function productToForm(p: Product): ProductFormData {
  return {
    name: p.name,
    price: p.price,
    category: p.category,
    type: p.type || 'financed',
    description: p.description || '',
    saving_factor_electric: p.savingFactorElectric ?? 0,
    saving_factor_fuel: p.savingFactorFuel ?? 0,
    warranty: p.warranty,
    installation: p.installation,
    monthly_saving: p.monthlySaving ?? 0,
    annual_saving: p.annualSaving ?? 0,
    payback: p.payback,
    rating: p.rating ?? 4.5,
  };
}

export function formToApiBody(form: ProductFormData) {
  return {
    name: form.name.trim(),
    price: form.price,
    category: form.category.trim(),
    type: form.type,
    description: form.description.trim() || null,
    saving_factor_electric: form.saving_factor_electric,
    saving_factor_fuel: form.saving_factor_fuel,
    warranty: form.warranty?.trim() || null,
    installation: form.installation?.trim() || null,
    monthly_saving: form.monthly_saving,
    annual_saving: form.annual_saving,
    payback: form.payback?.trim() || null,
    rating: form.rating,
  };
}

const fieldStyle: CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  width: '100%',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 4,
};

const cellStyle: CSSProperties = { marginBottom: 12 };

const CATEGORIES = ['Solar', 'EV', 'Battery', 'Appliances', 'Lighting'];

type Props = {
  form: ProductFormData;
  onChange: (next: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  title?: string;
  headerExtra?: ReactNode;
};

export default function ProductFormEditor({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  title,
  headerExtra,
}: Props) {
  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  const num = (raw: string) => {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div style={{ marginTop: 12, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
      {title && (
        <h4 style={{ marginBottom: 12 }}>
          <i className="fas fa-box-open" /> {title}
        </h4>
      )}
      {headerExtra}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0 16px',
        }}
      >
        <div style={cellStyle}>
          <label style={labelStyle}>Product name *</label>
          <input
            style={fieldStyle}
            placeholder="e.g. Solar Panel Kit (3kW)"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Price (PKR) *</label>
          <input
            type="number"
            min={0}
            step={1}
            style={fieldStyle}
            placeholder="450000"
            value={form.price || ''}
            onChange={(e) => set('price', num(e.target.value))}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Category *</label>
          <select
            style={fieldStyle}
            value={CATEGORIES.includes(form.category) ? form.category : form.category ? '__custom__' : ''}
            onChange={(e) => {
              if (e.target.value === '__custom__') set('category', '');
              else set('category', e.target.value);
            }}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">Other (custom)</option>
          </select>
          {!CATEGORIES.includes(form.category) && (
            <input
              style={{ ...fieldStyle, marginTop: 6 }}
              placeholder="Custom category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />
          )}
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Purchase type</label>
          <select style={fieldStyle} value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="financed">Financed (Murabaha)</option>
            <option value="cash">Cash</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      <div style={cellStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...fieldStyle, minHeight: 72 }}
          placeholder="Short product description / savings pitch"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0 16px',
        }}
      >
        <div style={cellStyle}>
          <label style={labelStyle}>Electric saving factor (0–1)</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            style={fieldStyle}
            value={form.saving_factor_electric}
            onChange={(e) => set('saving_factor_electric', num(e.target.value))}
          />
          <span className="text-muted" style={{ fontSize: 11 }}>
            e.g. 0.70 = cuts electric bill ~70%
          </span>
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Fuel saving factor (0–1)</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            style={fieldStyle}
            value={form.saving_factor_fuel}
            onChange={(e) => set('saving_factor_fuel', num(e.target.value))}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Monthly saving (PKR)</label>
          <input
            type="number"
            min={0}
            step={1}
            style={fieldStyle}
            value={form.monthly_saving || ''}
            onChange={(e) => set('monthly_saving', num(e.target.value))}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Annual saving (PKR)</label>
          <input
            type="number"
            min={0}
            step={1}
            style={fieldStyle}
            value={form.annual_saving || ''}
            onChange={(e) => set('annual_saving', num(e.target.value))}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Warranty</label>
          <input
            style={fieldStyle}
            placeholder="e.g. 25 years"
            value={form.warranty ?? ''}
            onChange={(e) => set('warranty', e.target.value)}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Installation</label>
          <input
            style={fieldStyle}
            placeholder="e.g. Included / Self"
            value={form.installation ?? ''}
            onChange={(e) => set('installation', e.target.value)}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Payback period</label>
          <input
            style={fieldStyle}
            placeholder="e.g. 4 years"
            value={form.payback ?? ''}
            onChange={(e) => set('payback', e.target.value)}
          />
        </div>
        <div style={cellStyle}>
          <label style={labelStyle}>Rating (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            style={fieldStyle}
            value={form.rating}
            onChange={(e) => set('rating', num(e.target.value))}
          />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <Button size="sm" onClick={onSubmit}>
          <i className="fas fa-save" /> {submitLabel}
        </Button>{' '}
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
