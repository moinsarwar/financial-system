import { useEffect, useState } from 'react';
import type { ApiProduct, Product, Vendor } from '../../types';
import { api, formatCurrency, mapProduct } from '../../services/api';
import Modal from '../Common/Modal';
import Button from '../Common/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  vendor?: Vendor;
  monthly: number;
  down: number;
  onBuy: () => void;
}

export default function ProductDetailModal({
  open,
  onClose,
  product: initial,
  vendor,
  monthly,
  down,
  onBuy,
}: Props) {
  const [product, setProduct] = useState<Product | null>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !initial?.id) {
      setProduct(initial);
      return;
    }
    setProduct(initial);
    setLoading(true);
    api<ApiProduct>(`/products/${initial.id}`)
      .then((p) => setProduct(mapProduct(p)))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [open, initial?.id]);

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>
          {product.name}{' '}
          {loading && (
            <small className="text-muted" style={{ fontSize: 12 }}>
              refreshing…
            </small>
          )}
        </h2>
        <div>
          <span className="badge">{product.category}</span>{' '}
          <span className="badge" style={{ background: '#e0f2fe' }}>
            {vendor?.name || product.vendor?.name || ''}
          </span>
        </div>
        <div>
          <strong>Price:</strong> {formatCurrency(product.price)} <small>MRP</small>
        </div>
        <div>
          <strong>Financing:</strong> {formatCurrency(down)} down + {formatCurrency(monthly)}/mo for 24
          months
        </div>
        <div>
          <strong>Description:</strong> {product.description}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <strong>Warranty:</strong> {product.warranty}
          </div>
          <div>
            <strong>Installation:</strong> {product.installation}
          </div>
          <div>
            <strong>Monthly Saving:</strong> {formatCurrency(product.monthlySaving)}
          </div>
          <div>
            <strong>Annual Saving:</strong> {formatCurrency(product.annualSaving)}
          </div>
          <div>
            <strong>Payback Period:</strong> {product.payback}
          </div>
          <div>
            <strong>Rating:</strong> {'★'.repeat(Math.floor(product.rating))} {product.rating}
          </div>
        </div>
        <div style={{ background: 'var(--primary-light)', padding: 12, borderRadius: 12 }}>
          <strong>Savings Calculator</strong>
          <br />
          Current bill (avg): PKR 15,000
          <br />
          New bill: PKR {Math.round(15000 * (1 - product.savingFactorElectric))}
          <br />
          Monthly saving: {formatCurrency(product.monthlySaving)}
        </div>
        <Button
          onClick={() => {
            onBuy();
            onClose();
          }}
        >
          <i className="fas fa-shopping-bag" /> Buy Now
        </Button>
      </div>
    </Modal>
  );
}
