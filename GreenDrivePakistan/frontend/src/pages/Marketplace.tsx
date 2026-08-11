import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/Marketplace/ProductCard';
import ProductDetailModal from '../components/Marketplace/ProductDetailModal';
import ApplicationModal from '../components/Marketplace/ApplicationModal';
import LoginModal from '../components/Auth/LoginModal';
import type { Product } from '../types';

const CATEGORIES = ['all', 'Solar', 'EV', 'Appliances', 'Battery', 'Lighting'];

export default function Marketplace() {
  const { products, vendors, user, applications, computeProfit, financingTenure, financingDownRate } =
    useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Product | null>(null);
  const [applyProduct, setApplyProduct] = useState<Product | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchCategory = category === 'all' || p.category === category;
      const vendor = vendors.find((v) => v.id === p.vendorId);
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (vendor?.name.toLowerCase().includes(q) ?? false);
      return matchCategory && matchSearch;
    });
  }, [products, vendors, category, search]);

  const tenure = financingTenure > 0 ? financingTenure : 24;
  const downRate = financingDownRate >= 0 ? financingDownRate : 0.2;

  const finance = (p: Product) => {
    const profit = p.profit ?? computeProfit(p.price);
    const down = Math.round(p.price * downRate);
    if (downRate >= 1) {
      return { down, monthly: 0 };
    }
    const financed = Math.max(0, p.price + profit - down);
    return {
      down,
      monthly: tenure > 0 ? Math.round(financed / tenure) : 0,
    };
  };

  const initiatePurchase = (p: Product) => {
    if (!user || user.role !== 'user') {
      alert('Please login as a User to purchase.');
      setLoginOpen(true);
      return;
    }
    if (applications.some((a) => a.userId === user.id && a.productId === p.id)) {
      alert('You already have an application for this product.');
      return;
    }
    setApplyProduct(p);
  };

  return (
    <div className="container page-section">
      <div className="flex-between">
        <h2>
          <i className="fas fa-boxes" style={{ color: 'var(--primary)' }} /> Marketplace
        </h2>
        <span className="badge">🇵🇰 Pakistan</span>
      </div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-btn${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
          <i className="fas fa-star" /> Most Popular
        </span>
        <span className="badge" style={{ background: '#dbeafe', color: '#1e3a8a' }}>
          <i className="fas fa-crown" /> Best Value
        </span>
        <span className="badge" style={{ background: '#fce4ec', color: '#b91c1c' }}>
          <i className="fas fa-edit" /> Editor&apos;s Choice
        </span>
      </div>
      <div className="grid-3 mt-16">
        {filtered.length === 0 ? (
          <div className="card text-center" style={{ gridColumn: '1 / -1', padding: 40 }}>
            <i className="fas fa-search" style={{ fontSize: 32, color: 'var(--gray)' }} />
            <p className="text-muted mt-12">No products found. Try adjusting your search.</p>
          </div>
        ) : (
          filtered.map((p) => {
            const { down, monthly } = finance(p);
            const vendor = vendors.find((v) => v.id === p.vendorId) || p.vendor;
            return (
              <ProductCard
                key={p.id}
                product={p}
                vendor={vendor}
                down={down}
                monthly={monthly}
                tenure={tenure}
                onOpen={() => setDetail(p)}
                onBuy={() => initiatePurchase(p)}
              />
            );
          })
        )}
      </div>
      <ProductDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        product={detail}
        vendor={detail ? vendors.find((v) => v.id === detail.vendorId) || detail.vendor : undefined}
        down={detail ? finance(detail).down : 0}
        monthly={detail ? finance(detail).monthly : 0}
        tenure={tenure}
        onBuy={() => detail && initiatePurchase(detail)}
      />
      <ApplicationModal
        open={!!applyProduct}
        onClose={() => setApplyProduct(null)}
        product={applyProduct}
        down={applyProduct ? finance(applyProduct).down : 0}
        monthly={applyProduct ? finance(applyProduct).monthly : 0}
        onSubmitted={() => navigate('/dashboard')}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}
