import type { Product, Vendor } from '../../types';
import { formatCurrency } from '../../services/api';
import Button from '../Common/Button';

interface Props {
  product: Product;
  vendor?: Vendor;
  monthly: number;
  down: number;
  onOpen: () => void;
  onBuy: () => void;
}

export default function ProductCard({ product: p, vendor, monthly, down, onOpen, onBuy }: Props) {
  return (
    <div className="card product-card" onClick={onOpen}>
      <div className="flex-between">
        <span className="badge">{p.category}</span>
        <span style={{ fontSize: 12, color: 'var(--gray)' }}>{vendor?.name || ''}</span>
      </div>
      <h4 style={{ margin: '8px 0' }}>{p.name}</h4>
      <div className="price">
        {formatCurrency(p.price)} <small>MRP</small>
      </div>
      <div style={{ margin: '6px 0' }}>
        <i className="fas fa-calendar-alt" /> <strong>{formatCurrency(monthly)}</strong> / mo × 24
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <span className="badge" style={{ background: '#e0f2fe' }}>
          Down: {formatCurrency(down)}
        </span>
        <span className="sharia-badge">
          <i className="fas fa-handshake" /> Murabaha
        </span>
        {p.type === 'cash' && (
          <span className="badge" style={{ background: '#dbeafe' }}>
            Cash
          </span>
        )}
        {p.type === 'both' && (
          <span className="badge" style={{ background: '#fef3c7' }}>
            Both
          </span>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        <div className="spec">
          <span>Warranty</span>
          <span>{p.warranty}</span>
        </div>
        <div className="spec">
          <span>Installation</span>
          <span>{p.installation}</span>
        </div>
        <div className="spec">
          <span>Monthly Saving</span>
          <span className="saving-positive">{formatCurrency(p.monthlySaving)}</span>
        </div>
        <div className="spec">
          <span>Annual Saving</span>
          <span className="saving-positive">{formatCurrency(p.annualSaving)}</span>
        </div>
        <div className="spec">
          <span>Payback</span>
          <span>{p.payback}</span>
        </div>
        <div className="spec">
          <span>Rating</span>
          <span>
            {'★'.repeat(Math.floor(p.rating))} {p.rating}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
        onClick={(e) => {
          e.stopPropagation();
          onBuy();
        }}
      >
        <i className="fas fa-shopping-bag" /> Buy Now (BNPL)
      </Button>
    </div>
  );
}
