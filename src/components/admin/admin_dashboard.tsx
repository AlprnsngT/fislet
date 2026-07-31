'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  FileCheck,
  Building2,
  DollarSign,
  PieChart as PieIcon,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth_store';

interface AnalyticsData {
  metrics: {
    totalReceiptsCount: number;
    processedReceiptsCount: number;
    rejectedReceiptsCount: number;
    totalUsersCount: number;
    totalVolume: number;
    totalCashbackPaid: number;
    avgBasketSize: number;
  };
  categoryAnalytics: Array<{
    categoryName: string;
    totalSpent: number;
    totalQuantity: number;
    itemCount: number;
  }>;
  topProducts: Array<{
    itemName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  merchantShare: Array<{
    merchantName: string;
    receiptCount: number;
    totalVolume: number;
  }>;
  recentReceipts: Array<{
    id: string;
    user: string;
    merchantName: string;
    totalAmount: number;
    cashbackAmount: number;
    status: string;
    date: string;
    itemsCount: number;
  }>;
}

export const AdminDashboardView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 font-sans pb-16">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#0c101d]/90 backdrop-blur-md border-b border-purple-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  B2B PAZARLAMA & VERİ ANALİTİĞİ
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                  ADMIN PANELİ
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Pazarlama şirketleri için canlı tüketici davranışları & ürün trend analizi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAnalytics}
              className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors flex items-center space-x-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            <div className="h-6 w-px bg-gray-800" />

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{user?.name || user?.username}</div>
              <div className="text-[10px] text-purple-400 font-mono">ROLE: {user?.role}</div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold">Toplam Okutulan Fiş</span>
              <FileCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {data?.metrics.totalReceiptsCount || 0}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
              <span>Onaylanan: {data?.metrics.processedReceiptsCount || 0}</span>
              <span>•</span>
              <span className="text-red-400">Red: {data?.metrics.rejectedReceiptsCount || 0}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold">Toplam Ticari Hacim</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ₺{data?.metrics.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Dağıtılan Cashback: ₺{data?.metrics.totalCashbackPaid.toFixed(2) || '0,00'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold">Ortalama Sepet Tutarı (AOV)</span>
              <ShoppingBag className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400">
              ₺{data?.metrics.avgBasketSize.toFixed(2) || '0,00'}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Fiş başına düşen ortalama harcama</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold">Aktif Tüketici Sayısı</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {data?.metrics.totalUsersCount || 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Sistemde fiş yükleyen tekil kullanıcı</div>
          </motion.div>
        </div>

        {/* Analytics Section 1: Top Products & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Products (Ürün Trendleri) */}
          <div className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-[#0c101d]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Top Ürün Satış Trendleri</h3>
              </div>
              <span className="text-xs text-gray-400">Pazarlama Verisi</span>
            </div>

            <div className="space-y-4">
              {data?.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((prod, index) => (
                  <div
                    key={prod.itemName}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-200">{prod.itemName}</div>
                        <div className="text-xs text-gray-400">Toplam Hacim: ₺{prod.totalRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                        {prod.totalQuantity} Adet Okutuldu
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">Ürün verisi henüz oluşmadı.</div>
              )}
            </div>
          </div>

          {/* Category Share Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-[#0c101d]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Kategori Harcama Dağılımı</h3>
              </div>
              <span className="text-xs text-gray-400">Sektörel Pazar</span>
            </div>

            <div className="space-y-4">
              {data?.categoryAnalytics && data.categoryAnalytics.length > 0 ? (
                data.categoryAnalytics.map((cat) => (
                  <div key={cat.categoryName} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-gray-200">{cat.categoryName}</span>
                      <span className="font-bold text-emerald-400">₺{cat.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (cat.totalSpent / (data.metrics.totalVolume || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>Satılan Adet: {cat.totalQuantity}</span>
                      <span>Fiş İçi Kalem: {cat.itemCount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">Kategori verisi henüz oluşmadı.</div>
              )}
            </div>
          </div>
        </div>

        {/* Merchant Market Share */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800 bg-[#0c101d]">
          <div className="flex items-center space-x-2 mb-6">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Zincir Market & Mağaza Pazar Payları</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.merchantShare && data.merchantShare.length > 0 ? (
              data.merchantShare.map((merch) => (
                <div
                  key={merch.merchantName}
                  className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{merch.merchantName}</div>
                    <div className="text-xs text-gray-400">{merch.receiptCount} Fiş Okutuldu</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-amber-400">
                      ₺{merch.totalVolume.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">Pazar Hacmi</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center col-span-full py-6 text-gray-500 text-sm">Mağaza verisi yok.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
