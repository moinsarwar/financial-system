import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { api, formatCurrency } from '../../services/api';
import type { CompareResponse, CompareResult } from '../../types';
import Button from '../Common/Button';

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12,
  fontSize: 15,
  background: '#fff',
};

type FinancingDefaults = {
  max_tenure?: number;
  profit_rate?: number;
  lender_name?: string | null;
  down_payment_rate?: number;
  default_horizon_years?: number;
  horizon_options?: number[];
};

export default function CompareEngine() {
  const [electric, setElectric] = useState('15000');
  const [fuel, setFuel] = useState('10000');
  const [compareType, setCompareType] = useState('both');
  const [category, setCategory] = useState('all');
  const [tenure, setTenure] = useState('');
  const [downPct, setDownPct] = useState('');
  const [horizon, setHorizon] = useState('5');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [narrowToSelected, setNarrowToSelected] = useState(false);
  const [defaults, setDefaults] = useState<FinancingDefaults | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const aiTimer = useRef<ReturnType<typeof setTimeout>>();
  const aiReqId = useRef(0);

  useEffect(() => {
    api<FinancingDefaults>('/compare/financing')
      .then((d) => {
        setDefaults(d);
        if (d.max_tenure) setTenure(String(d.max_tenure));
        if (d.down_payment_rate != null) setDownPct(String(Math.round(d.down_payment_rate * 100)));
        if (d.default_horizon_years) setHorizon(String(d.default_horizon_years));
      })
      .catch(console.warn);
  }, []);

  const maxTenure = defaults?.max_tenure || data?.lender_max_tenure || 60;
  const horizonOptions = defaults?.horizon_options || [3, 5, 7, 10];
  const categories = useMemo(() => {
    const fromApi = data?.categories || [];
    return ['all', ...fromApi];
  }, [data?.categories]);

  const buildCompareBody = useCallback(() => {
    const tenureNum = parseInt(tenure, 10);
    const downNum = parseFloat(downPct);
    const horizonNum = parseInt(horizon, 10);
    const body: Record<string, unknown> = {
      electricity_bill: parseFloat(electric) || 0,
      fuel_bill: parseFloat(fuel) || 0,
      compare_type: compareType,
      category: category === 'all' ? null : category,
      horizon_years: Number.isFinite(horizonNum) && horizonNum > 0 ? horizonNum : 5,
    };
    if (Number.isFinite(tenureNum) && tenureNum > 0) {
      body.tenure_months = tenureNum;
    }
    if (Number.isFinite(downNum) && downNum >= 0) {
      body.down_payment_rate = Math.min(100, downNum) / 100;
    }
    if (narrowToSelected && selectedIds.length) {
      body.product_ids = selectedIds;
    }
    return body;
  }, [electric, fuel, compareType, category, tenure, downPct, horizon, selectedIds, narrowToSelected]);

  const buildAiQueryFromForm = useCallback(() => {
    const e = parseFloat(electric) || 0;
    const f = parseFloat(fuel) || 0;
    const t = parseInt(tenure, 10) || maxTenure;
    const d = parseFloat(downPct);
    const down = Number.isFinite(d) ? Math.min(100, Math.max(0, d)) : 20;
    const h = parseInt(horizon, 10) || 5;
    const typeLabel =
      compareType === 'electricity'
        ? 'electricity only'
        : compareType === 'fuel'
          ? 'fuel only'
          : 'electricity and fuel';
    const catLabel = category === 'all' ? 'any category' : `${category} products`;
    const parts = [
      `I pay about PKR ${Math.round(e).toLocaleString()} electricity and PKR ${Math.round(f).toLocaleString()} fuel per month.`,
      `Compare against ${typeLabel}.`,
      `I want the best matching product from ${catLabel}.`,
      `Financing: ${t} months tenure, ${down}% down payment, focus on ${h}-year net savings.`,
      'Recommend one product that fits this situation and explain briefly using the numbers.',
    ];
    if (narrowToSelected && selectedIds.length) {
      parts.push(`Only consider the ${selectedIds.length} products I selected.`);
    }
    return parts.join(' ');
  }, [
    electric,
    fuel,
    compareType,
    category,
    tenure,
    downPct,
    horizon,
    maxTenure,
    narrowToSelected,
    selectedIds,
  ]);

  const run = useCallback(async () => {
    try {
      const res = await api<CompareResponse>('/compare/', {
        method: 'POST',
        body: buildCompareBody(),
      });
      setData(res);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compare unavailable');
      setData(null);
    }
  }, [buildCompareBody]);

  useEffect(() => {
    run();
  }, [run]);

  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, 400);
  };

  const askAiWithQuery = useCallback(
    async (q: string) => {
      const query = q.trim();
      if (query.length < 3) return;
      const req = ++aiReqId.current;
      setAiLoading(true);
      setAiError('');
      try {
        const res = await api<{ recommendation: string }>(
          '/compare/ai-recommend',
          {
            method: 'POST',
            body: { ...buildCompareBody(), query },
          },
        );
        if (req !== aiReqId.current) return;
        setAiText(res.recommendation);
      } catch {
        if (req !== aiReqId.current) return;
        setAiText('');
        setAiError('Recommendation unavailable right now.');
      } finally {
        if (req === aiReqId.current) setAiLoading(false);
      }
    },
    [buildCompareBody],
  );

  // Form/compare updates → silent auto recommendation
  useEffect(() => {
    if (!data?.results?.length) return;
    const q = buildAiQueryFromForm();
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => {
      askAiWithQuery(q);
    }, 900);
    return () => clearTimeout(aiTimer.current);
  }, [data, buildAiQueryFromForm, askAiWithQuery]);

  const best = data?.best_product;
  const totalBill = data?.total_current_bill || 0;
  const results: CompareResult[] = data?.results || [];
  const tenureLabel = data?.tenure_months ?? tenure ?? maxTenure;
  const parsedHorizon = parseInt(horizon, 10) || 5;
  const horizonLabel = data?.horizon_years ?? parsedHorizon;
  const netKey = (p: CompareResult) => p.horizon_net_saving ?? p.five_year_net_saving;

  const formulaBanner =
    best &&
    `${best.product_name} — New bill: ${formatCurrency(best.new_total_bill)} + installment ${formatCurrency(best.monthly_installment)} = ${formatCurrency(best.new_total_bill + best.monthly_installment)}. Monthly saving: ${formatCurrency(best.monthly_saving)} (${formatCurrency(best.yearly_saving)}/year). ${horizonLabel}-year net: ${formatCurrency(netKey(best))}${best.down_payment != null ? ` (down ${formatCurrency(best.down_payment)} @ ${Math.round((data?.down_payment_rate ?? 0.2) * 100)}%).` : '.'}`;

  const clearProductFilter = () => {
    setSelectedIds([]);
    setNarrowToSelected(false);
  };

  const applyProductFilter = () => {
    if (!selectedIds.length) {
      alert('Tick at least one product in the table first.');
      return;
    }
    setNarrowToSelected(true);
  };

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-chart-line" style={{ color: 'var(--primary)' }} /> Comparison Engine
      </h2>
      <p className="text-muted">
        Enter bills and tune tenure, down payment, horizon, and product filters. Financing defaults
        follow the active lender
        {defaults?.lender_name ? ` (${defaults.lender_name})` : ''}.
      </p>

      <div className="card mt-16">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label>
              <i className="fas fa-bolt" /> Electricity Bill (PKR/mo)
            </label>
            <input
              type="number"
              value={electric}
              onChange={(e) => {
                setElectric(e.target.value);
                schedule();
              }}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label>
              <i className="fas fa-gas-pump" /> Fuel Bill (PKR/mo)
            </label>
            <input
              type="number"
              value={fuel}
              onChange={(e) => {
                setFuel(e.target.value);
                schedule();
              }}
              style={inputStyle}
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <label>Compare against</label>
            <select
              value={compareType}
              onChange={(e) => setCompareType(e.target.value)}
              style={inputStyle}
            >
              <option value="both">Both (Electricity + Fuel)</option>
              <option value="electricity">Electricity only</option>
              <option value="fuel">Fuel only</option>
            </select>
          </div>
          <div style={{ minWidth: 130 }}>
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-end',
            marginTop: 12,
          }}
        >
          <div style={{ minWidth: 140 }}>
            <label>Tenure (months)</label>
            <select
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              style={inputStyle}
            >
              {Array.from(new Set([12, 18, 24, 36, 48, 60, maxTenure]))
                .filter((m) => m > 0 && m <= maxTenure)
                .sort((a, b) => a - b)
                .map((m) => (
                  <option key={m} value={m}>
                    {m} mo {m === maxTenure ? '(lender max)' : ''}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label>Down payment (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={downPct}
              onChange={(e) => {
                setDownPct(e.target.value);
                schedule();
              }}
              style={inputStyle}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <label>Net saving horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              style={inputStyle}
            >
              {horizonOptions.map((y) => (
                <option key={y} value={y}>
                  {y} years
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button onClick={run}>
              <i className="fas fa-sync-alt" /> Calculate Savings
            </Button>
          </div>
          <div>
            <Button variant="secondary" onClick={applyProductFilter}>
              <i className="fas fa-filter" /> Compare selected
            </Button>
          </div>
        </div>
        {narrowToSelected && selectedIds.length > 0 && (
          <p className="text-muted mt-12" style={{ fontSize: 13 }}>
            Showing {selectedIds.length} selected product(s).{' '}
            <button
              type="button"
              onClick={clearProductFilter}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Show all again
            </button>
          </p>
        )}
        {!narrowToSelected && selectedIds.length > 0 && (
          <p className="text-muted mt-12" style={{ fontSize: 13 }}>
            {selectedIds.length} product(s) ticked — click &quot;Compare selected&quot; to narrow.
          </p>
        )}
      </div>

      {totalBill > 0 && best && (
        <div
          style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
          }}
        >
          <div className="compare-summary-grid">
            <div className="stat-item">
              <div className="label">Current Bill</div>
              <div className="value">{formatCurrency(totalBill)}</div>
            </div>
            <div className="stat-item">
              <div className="label">Best Product</div>
              <div className="value" style={{ fontSize: 16 }}>
                {best.product_name}
              </div>
            </div>
            <div className="stat-item">
              <div className="label">New Bill</div>
              <div className="value">{formatCurrency(best.new_total_bill)}</div>
            </div>
            <div className="stat-item">
              <div className="label">Monthly Installment</div>
              <div className="value">{formatCurrency(best.monthly_installment)}</div>
            </div>
            <div className="stat-item highlight">
              <div className="label">Monthly Saving</div>
              <div className="value">{formatCurrency(best.monthly_saving)}</div>
            </div>
            <div className="stat-item highlight">
              <div className="label">Yearly Saving</div>
              <div className="value">{formatCurrency(best.yearly_saving)}</div>
            </div>
            <div className="stat-item">
              <div className="label">{horizonLabel}-Year Net Saving</div>
              <div className="value">{formatCurrency(netKey(best))}</div>
            </div>
          </div>
          <div
            className="mt-12"
            style={{
              background: '#fef9c3',
              border: '1px solid #f59e0b',
              padding: 12,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              {aiLoading ? (
                <span className="text-muted">
                  <i className="fas fa-spinner fa-spin" /> Updating recommendation…
                </span>
              ) : aiError ? (
                <span className="text-muted">
                  <i className="fas fa-star" /> 🏆 <strong>{best.product_name}</strong> —{' '}
                  {formulaBanner?.replace(`${best.product_name} — `, '')}
                </span>
              ) : aiText ? (
                <>
                  <i className="fas fa-star" /> {aiText}
                </>
              ) : (
                <>
                  <i className="fas fa-star" /> 🏆 <strong>{best.product_name}</strong> —{' '}
                  {formulaBanner?.replace(`${best.product_name} — `, '')}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="table-wrap mt-16">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Product</th>
              <th>Price</th>
              <th>Monthly ({tenureLabel}mo)</th>
              <th>Current Bill</th>
              <th>New Bill</th>
              <th>Monthly Saving</th>
              <th>Yearly Saving</th>
              <th>{horizonLabel}-Year Net</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={9} className="text-muted">
                  Compare unavailable: {error}
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              results.map((p) => {
                const savingColor = p.monthly_saving > 0 ? 'var(--primary)' : '#b91c1c';
                const net = netKey(p);
                const checked = selectedIds.includes(p.product_id);
                return (
                  <tr key={p.product_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        title="Compare only selected"
                        onChange={() => toggleProduct(p.product_id)}
                      />
                    </td>
                    <td>
                      <strong>{p.product_name}</strong>{' '}
                      <span className="badge" style={{ background: '#e0f2fe' }}>
                        {p.category || ''}{' '}
                        {p.saving_factor_electric > 0 ? '⚡' : ''}
                        {p.saving_factor_fuel > 0 ? '⛽' : ''}
                      </span>
                    </td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{formatCurrency(p.monthly_installment)}</td>
                    <td>{formatCurrency(p.current_total_bill)}</td>
                    <td>{formatCurrency(p.new_total_bill)}</td>
                    <td style={{ color: savingColor }}>{formatCurrency(p.monthly_saving)}</td>
                    <td style={{ color: savingColor }}>{formatCurrency(p.yearly_saving)}</td>
                    <td style={{ color: net > 0 ? 'var(--primary)' : '#b91c1c' }}>
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-muted mt-12" style={{ fontSize: 12 }}>
        Tip: tick products in the first column to re-run compare on only those items. Tenure cannot
        exceed active lender max ({maxTenure} mo).
      </p>
    </div>
  );
}
