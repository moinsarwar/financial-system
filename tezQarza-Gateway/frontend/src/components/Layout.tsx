import React from 'react';
import { Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary">TezQarza</Link>
          <div className="space-x-4 text-sm font-medium">
            <Link to="/products" className="hover:text-gold">Products</Link>
            <Link to="/apply" className="hover:text-gold">Apply</Link>
            <Link to="/dashboard" className="hover:text-gold">Dashboard</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
