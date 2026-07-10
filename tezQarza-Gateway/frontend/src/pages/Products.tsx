import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { Product } from '../types';

const Products: React.FC = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products/');
      return res.data as Product[];
    },
  });

  const setProducts = useAppStore((state) => state.setProducts);
  const storedProducts = useAppStore((state) => state.products);

  useEffect(() => {
    if (products) setProducts(products);
  }, [products, setProducts]);

  const display = products || storedProducts;

  if (isLoading && !display.length) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {display.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition">
            <div className="text-3xl text-gold mb-2"><i className={`fas ${p.icon}`}></i></div>
            <h3 className="font-bold text-lg">{p.name}</h3>
            <p className="text-sm text-gray-600">{p.ideal}</p>
            <p className="text-sm mt-1">Up to ₨{(p.max_amount/1000).toFixed(0)}k</p>
            <p className="text-sm text-gray-500">{p.processing}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
