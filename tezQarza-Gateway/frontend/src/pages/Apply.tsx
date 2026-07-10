import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { Application } from '../types';

interface FormData {
  product_id: string;
  full_name: string;
  cnic: string;
  mobile: string;
  income: number;
  liabilities: number;
  amount: number;
  tenure: number;
}

const Apply: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [result, setResult] = useState<Application | null>(null);
  const addApplication = useAppStore((state) => state.addApplication);
  const products = useAppStore((state) => state.products);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/applications', data);
      return res.data as Application;
    },
    onSuccess: (data) => {
      setResult(data);
      addApplication(data);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Apply for Financing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Product</label>
              <select {...register('product_id', { required: true })} className="w-full border rounded p-2">
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.product_id && <p className="text-red-500 text-xs">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input {...register('full_name', { required: true })} className="w-full border rounded p-2" />
              {errors.full_name && <p className="text-red-500 text-xs">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">CNIC (13 digits)</label>
              <input {...register('cnic', { required: true, pattern: /^\d{13}$/ })} className="w-full border rounded p-2" />
              {errors.cnic && <p className="text-red-500 text-xs">13 digits required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Mobile (03XXXXXXXXX)</label>
              <input {...register('mobile', { required: true, pattern: /^03\d{9}$/ })} className="w-full border rounded p-2" />
              {errors.mobile && <p className="text-red-500 text-xs">Invalid format</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Monthly Income (PKR)</label>
              <input type="number" {...register('income', { required: true, min: 0 })} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Liabilities (PKR)</label>
              <input type="number" {...register('liabilities')} className="w-full border rounded p-2" defaultValue={0} />
            </div>
            <div>
              <label className="block text-sm font-medium">Requested Amount (PKR)</label>
              <input type="number" {...register('amount', { required: true, min: 1 })} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Tenure (months)</label>
              <input type="number" {...register('tenure', { required: true, min: 1 })} className="w-full border rounded p-2" />
            </div>
            <button type="submit" disabled={mutation.isLoading} className="w-full bg-primary text-white py-2 rounded hover:bg-opacity-90 disabled:opacity-50">
              {mutation.isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          {result ? (
            <div className="space-y-2">
              <p><span className="font-semibold">Ref:</span> {result.ref}</p>
              <p><span className="font-semibold">Status:</span> {result.status}</p>
              {result.decision && <p><span className="font-semibold">Decision:</span> {result.decision}</p>}
              {result.score && <p><span className="font-semibold">Score:</span> {result.score}</p>}
              {result.route && <p><span className="font-semibold">Route:</span> {result.route}</p>}
              <div>
                <span className="font-semibold">Reason Codes:</span>
                <ul className="list-disc pl-5 text-sm">
                  {result.reason_codes.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Submit an application to see the result.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Apply;
