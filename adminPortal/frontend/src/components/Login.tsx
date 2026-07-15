import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Box } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }
      
      if (data.status === 'success') {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left side: Brand/Illustration */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="z-10 text-center">
          <div className="bg-indigo-600/20 p-6 rounded-3xl inline-block mb-8 border border-indigo-500/30 backdrop-blur-sm">
            <Box className="w-16 h-16 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">FinOS Central</h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto leading-relaxed">
            The unified control plane for monitoring and managing all your financial-system microservices.
          </p>
          
          <div className="mt-16 grid grid-cols-2 gap-6 text-left max-w-lg mx-auto">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Secure Access</h3>
              <p className="text-sm text-slate-400">Enterprise-grade security protocols for safe infrastructure management.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-md">
              <Activity className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Real-time Metrics</h3>
              <p className="text-sm text-slate-400">Monitor CPU, Memory, and container health with zero latency.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 bg-white relative">
        <div className="mx-auto w-full max-w-md">
          
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Welcome back</h2>
            <p className="text-slate-500 text-lg">Please sign in to access the admin portal.</p>
          </div>

          <div className="bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in slide-in-from-top-2">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent focus:bg-white transition-all outline-none"
                    placeholder="admin@tezqarza.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center mt-6">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 mt-8"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Sign in to Portal
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Note: Activity icon is needed for the decorative left panel
import { Activity } from 'lucide-react';
