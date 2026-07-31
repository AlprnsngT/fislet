'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/stores/auth_store';
import { LandingView } from '@/components/landing/landing_view';
import { DashboardView } from '@/components/dashboard/dashboard_view';
import { AuthModal } from '@/components/auth/auth_modal';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090d16] text-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {user ? <DashboardView /> : <LandingView />}
      <AuthModal />
    </>
  );
}
