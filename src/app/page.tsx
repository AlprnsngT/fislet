'use client';

import React from 'react';
import { useAuthStore } from '@/shared/stores/auth_store';
import { LandingView } from '@/components/landing/landing_view';
import { DashboardView } from '@/components/dashboard/dashboard_view';
import { AuthModal } from '@/components/auth/auth_modal';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <>
      {user ? <DashboardView /> : <LandingView />}
      <AuthModal />
    </>
  );
}
