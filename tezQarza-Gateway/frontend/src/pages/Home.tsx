import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="bg-primary text-white p-8 rounded-2xl">
        <h1 className="text-4xl font-bold">One Application.<br /><span className="text-gold">Multiple Financing Partners.</span></h1>
        <p className="mt-4 text-lg">TezQarza is a channel gateway for the Loan Facilitation Engine.</p>
        <Link to="/apply" className="mt-6 inline-block bg-gold text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gold-light">
          Get Started
        </Link>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg">Discover Products</h3>
          <p className="text-gray-600">Browse financing options from partner lenders.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg">Apply Once</h3>
          <p className="text-gray-600">Submit your application and documents.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg">Get Matched</h3>
          <p className="text-gray-600">LFE routes your request to suitable lenders.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
