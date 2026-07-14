'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function MortgageLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('unauthorized=true')) {
      setError('You are not authorized to access Moonstar Mortgage CRM.');
    }
  }, []);

  const handleMortgageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your Moonstar Mortgage credentials.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        setLoading(false);
        setError(authError?.message || 'Invalid login credentials.');
        return;
      }

      const userEmail = authData.user.email || email.trim();

      // 2. Verify that the authenticated user's email exists in the mortgage_users table
      let isAuthorized = false;

      try {
        const verifyRes = await fetch('/api/mortgage/auth/verify-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
        const verifyJson = await verifyRes.json();
        if (verifyJson.authorized) {
          isAuthorized = true;
        }
      } catch (err) {
        // Fallback check directly via client query if API fetch fails
        const { data: directCheck } = await supabase
          .from('mortgage_users')
          .select('id')
          .ilike('email', userEmail)
          .maybeSingle();
        if (directCheck) {
          isAuthorized = true;
        }
      }

      // 3. If the user is not found in mortgage_users, deny access and sign out
      if (!isAuthorized) {
        await supabase.auth.signOut();
        setLoading(false);
        setError('You are not authorized to access Moonstar Mortgage CRM.');
        return;
      }

      // 4. Authorized Mortgage User — Store session token and proceed
      if (typeof window !== 'undefined') {
        localStorage.setItem('moonstar_mortgage_authenticated', 'true');
        localStorage.setItem('moonstar_mortgage_user_email', userEmail);
      }

      setLoading(false);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/mortgage/login');
      }
      router.replace('/mortgage');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication error.');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/30 mb-4">
            M
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Moonstar Mortgage Portal
          </h1>
          <p className="text-xs text-blue-400 font-semibold mt-1 uppercase tracking-wider">
            Dedicated Lending Module Login
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleMortgageLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mortgage Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@moonstarmortgage.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Authorization...' : 'Sign In to Mortgage CRM'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4"
          >
            ← Back to Product Selection Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
