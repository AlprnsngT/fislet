'use client';

import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Activity,
  Package,
  Settings,
  ChevronRight,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth_store';

export type AdminTabType = 'analytics' | 'charts' | 'products' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  totalProductsCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  totalProductsCount,
  loading,
  onRefresh,
}) => {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-full md:w-64 h-auto md:h-screen md:sticky md:top-0 bg-[#0c101d] border-r border-purple-500/20 flex flex-col justify-between p-5 flex-shrink-0 z-30">
      <div>
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 mb-8 px-2">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-black text-white tracking-wide">
              FISOKUT<span className="text-purple-400"> B2B</span>
            </div>
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
              ADMIN PANELİ
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'analytics'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Analizler</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'charts'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Activity className="w-4 h-4" />
              <span>Grafikler</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'products'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-4 h-4" />
              <span>Ürünlerim ({totalProductsCount})</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'settings'
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-4 h-4" />
              <span>Sistem Ayarları</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        </nav>
      </div>

      {/* Permanently Fixed Sidebar Footer: Admin Profile & Logout */}
      <div className="pt-4 border-t border-gray-800/80 mt-6 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between px-2">
          <div>
            <div className="text-xs font-bold text-white">{user?.name || user?.username}</div>
            <div className="text-[10px] text-purple-400 font-mono">ROLE: {user?.role}</div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};
