import { useCallback, useEffect, useRef, useState } from 'react';
import { api, formatCurrency } from '../../services/api';
import type { CompareResponse, CompareResult } from '../../types';
import Button from '../Common/Button';

export default function CompareEngine() {
  const [electric, setElectric] = useState('15000');
  const [fuel, setFuel] = useState('10000');
  const [compareType, setCompareType] = useState('both');
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const run = useCallback(async () => {
    try {
      const res = await api<CompareResponse>('/compare/', {
        method: 'POST',
        body: {
          electricity_bill: parseFloat(electric) || 0,
          fuel_bill: parseFloat(fuel) || 0,
          compare_type: compareType,
        },
      });
      setData(res);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compare unavailable');
      setData(null);
    }
  }, [electric, fuel, compareType]);

  useEffect(() => {
    run();
  }, [run]);

  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, 400);
  };

  const best = data?.best_product;
  const totalBill = data?.total_current_bill || 0;
  const results: CompareResult[] = data?.results || [];

  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-chart-line" style={{ color: 'var(--primary)' }} /> Comparison Engine
      </h2>
      <p className="text-muted">
        Enter your monthly bills and see realistic savings after product purchase and financing.
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
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 15,
              }}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 15,
              }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label>Compare against</label>
            <select
              value={compareType}
              onChange={(e) => setCompareType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 15,
                background: '#fff',
              }}
            >
              <option value="both">Both (Electricity + Fuel)</option>
              <option value="electricity">Electricity only</option>
              <option value="fuel">Fuel only</option>
            </select>
          </div>
          <div>
            <Button onClick={run}>
              <i className="fas fa-sync-alt" /> Calculate Savings
            </Button>
          </div>
        </div>
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
              <div className="label">5-Year Net Saving</div>
              <div className="value">{formatCurrency(best.five_year_net_saving)}</div>
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
            <i className="fas fa-star" /> 🏆 <strong>{best.product_name}</strong> — New bill:{' '}
            {formatCurrency(best.new_total_bill)} + installment{' '}
            {formatCurrency(best.monthly_installment)} ={' '}
            {formatCurrency(best.new_total_bill + best.monthly_installment)}. Monthly saving:{' '}
            <strong>{formatCurrency(best.monthly_saving)}</strong> (
            {formatCurrency(best.yearly_saving)}/year). 5-year net saving:{' '}
            <strong>{formatCurrency(best.five_year_net_saving)}</strong>.
          </div>
        </div>
      )}
      <div className="table-wrap mt-16">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Monthly (24mo)</th>
              <th>Current Bill</th>
              <th>New Bill</th>
              <th>Monthly Saving</th>
              <th>Yearly Saving</th>
              <th>5-Year Net Saving</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={8} className="text-muted">
                  Compare unavailable: {error}
                </td>
              </tr>
            ) : (
              results.map((p) => {
                const savingColor = p.monthly_saving > 0 ? 'var(--primary)' : '#b91c1c';
                return (
                  <tr key={p.product_id}>
                    <td>
                      <strong>{p.product_name}</strong>{' '}
                      <span className="badge" style={{ background: '#e0f2fe' }}>
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
                    <td
                      style={{
                        color: p.five_year_net_saving > 0 ? 'var(--primary)' : '#b91c1c',
                      }}
                    >
                      {formatCurrency(p.five_year_net_saving)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
