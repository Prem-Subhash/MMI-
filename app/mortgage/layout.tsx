'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MortgageSidebar from './components/MortgageSidebar';
import { supabase } from '@/lib/supabaseClient';
import './mortgage-dates.css';

export default function MortgageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/mortgage/login';

  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [isAuthorized, setIsAuthorized] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      setIsAuthorized(true);
      return;
    }

    let isMounted = true;

    const verifySecureSession = async () => {
      setCheckingAuth(true);

      // 1. Verify current Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError || !session || !session.user || !session.user.email) {
        // Clear any locally cached mortgage tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moonstar_mortgage_authenticated');
          localStorage.removeItem('moonstar_mortgage_user_email');
          sessionStorage.clear();
        }
        router.replace('/mortgage/login');
        return;
      }

      const userEmail = session.user.email;

      // 2. Verify that the authenticated user's email exists in the mortgage_users table
      let authorizedInTable = false;

      try {
        const verifyRes = await fetch('/api/mortgage/auth/verify-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
        const verifyJson = await verifyRes.json();
        if (verifyJson && verifyJson.authorized) {
          authorizedInTable = true;
        }
      } catch (err) {
        // Fallback check directly via Supabase client
        try {
          const { data: directUser } = await supabase
            .from('mortgage_users')
            .select('id')
            .ilike('email', userEmail)
            .maybeSingle();
          if (directUser) {
            authorizedInTable = true;
          }
        } catch (queryErr) {}
      }

      if (!isMounted) return;

      // 3. If not authorized in mortgage_users, sign out and redirect
      if (!authorizedInTable) {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moonstar_mortgage_authenticated');
          localStorage.removeItem('moonstar_mortgage_user_email');
          sessionStorage.clear();
        }
        router.replace('/mortgage/login?unauthorized=true');
        return;
      }

      // 4. Fully authenticated and authorized
      if (typeof window !== 'undefined') {
        localStorage.setItem('moonstar_mortgage_authenticated', 'true');
        localStorage.setItem('moonstar_mortgage_user_email', userEmail);
      }
      setIsAuthorized(true);
      setCheckingAuth(false);
    };

    verifySecureSession();

    // 5. Handle browser Back/Forward (popstate) and Back-Forward Cache restores (pageshow)
    const handleHistoryOrCacheChange = () => {
      verifySecureSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleHistoryOrCacheChange);
      window.addEventListener('pageshow', handleHistoryOrCacheChange);
    }

    // 6. Subscribe to real-time auth changes (e.g., token expiration or sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('moonstar_mortgage_authenticated');
          localStorage.removeItem('moonstar_mortgage_user_email');
          sessionStorage.clear();
        }
        router.replace('/mortgage/login');
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleHistoryOrCacheChange);
        window.removeEventListener('pageshow', handleHistoryOrCacheChange);
      }
    };
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-dvh bg-slate-950 text-white">{children}</div>;
  }

  // Prevent rendering protected content before session & authorization are verified
  if (checkingAuth || !isAuthorized) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Verifying secure lending session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex bg-slate-950 text-white overflow-hidden font-sans">
      <MortgageSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
