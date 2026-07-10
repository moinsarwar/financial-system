
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, Search, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchProducts = async () => {
  const res = await axios.get('/api/products');
  return res.data;
};

const Home = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="logo">FinCompare</div>
        <div className="nav-links">
          <Link to="/login" className="btn-login">Login</Link>
          <Link to="/dashboard" className="btn-primary">Dashboard <ArrowRight size={16} /></Link>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <span className="badge">Pakistan's #1 Financial Marketplace</span>
          <h1>Compare and find the best financial products</h1>
          <p>Instantly compare loans, insurance, and savings accounts across all major providers in Pakistan with AI-powered matching.</p>
          
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="I am looking for a personal loan of 500,000 PKR..." />
            <button className="btn-primary">Find Matches</button>
          </div>
        </div>
      </header>

      <section className="features-section">
        <div className="feature-card">
          <div className="icon-wrapper"><Shield size={24} /></div>
          <h3>Secure & Verified</h3>
          <p>All providers are verified by SBP and SECP.</p>
        </div>
        <div className="feature-card">
          <div className="icon-wrapper"><Zap size={24} /></div>
          <h3>Instant Approvals</h3>
          <p>Get pre-approved in minutes through our direct integration.</p>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Top Recommended Products</h2>
        {isLoading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products?.slice(0, 3).map((p: any) => (
              <div key={p.id} className="product-card">
                <div className="product-header">
                  <h3>{p.name}</h3>
                  <span className="provider-tag">{p.tag || p.provider_id}</span>
                </div>
                <div className="product-details">
                  <div className="detail">
                    <span>Amount</span>
                    <strong>Up to {p.max_amount}</strong>
                  </div>
                  <div className="detail">
                    <span>Tenure</span>
                    <strong>{p.min_tenure}-{p.max_tenure} months</strong>
                  </div>
                </div>
                <button className="btn-outline">View Details</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
