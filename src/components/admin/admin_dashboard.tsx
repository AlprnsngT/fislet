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
  LineChart as LineChartIcon,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
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
  dailyTrend: Array<{
    date: string;
    fişSayısı: number;
    hacim: number;
  }>;
  categoryAnalytics: Array<{
    name: string;
    value: number;
    quantity: number;
  }>;
  topProducts: Array<{
    itemName: string;
    adet: number;
    tutar: number;
  }>;
  merchantShare: Array<{
    name: string;
    fişSayısı: number;
    hacim: number;
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

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

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
    <div className="min-h-screen bg-[#070a12] text-gray-100 font-sans pb-20">
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
                  ADMIN LIVE DASHBOARD
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Veritabanından çekilen canlı tüketici eğilimleri & grafiksel pazar analizleri
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d] shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileCheck className="w-24 h-24 text-purple-400" />
            </div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Toplam Fiş Taraması</span>
              <FileCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {data?.metrics.totalReceiptsCount || 0}
            </div>
            <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
              <span className="text-emerald-400 font-bold">✓ {data?.metrics.processedReceiptsCount || 0} Onay</span>
              <span>•</span>
              <span className="text-red-400 font-bold">✕ {data?.metrics.rejectedReceiptsCount || 0} Red</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d] shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="w-24 h-24 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Ticari Hacim</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              ₺{data?.metrics.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Ödenen İade: <span className="text-emerald-300 font-bold">₺{data?.metrics.totalCashbackPaid.toFixed(2) || '0,00'}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d] shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShoppingBag className="w-24 h-24 text-blue-400" />
            </div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Ortalama Sepet (AOV)</span>
              <ShoppingBag className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400">
              ₺{data?.metrics.avgBasketSize.toFixed(2) || '0,00'}
            </div>
            <div className="text-xs text-gray-400 mt-2">Fiş başına ortalama tüketici harcaması</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d] shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-24 h-24 text-amber-400" />
            </div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Aktif Müşteri Hacmi</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              {data?.metrics.totalUsersCount || 0}
            </div>
            <div className="text-xs text-gray-400 mt-2">Sistemde fiş okutan tekil kullanıcı</div>
          </motion.div>
        </div>

        {/* SECTION 1: Dynamic Line Chart (Günlük Fiş Okutma Trend Grafiği) */}
        <div className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-[#0c101d] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <LineChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Zaman Bazlı Fiş Okuma & Hacim Trendi</h3>
                <p className="text-xs text-gray-400">Pazarlama analizi için son 7 günlük canlı hacim grafik eğrisi</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/30">
              Çizgi Grafik (Line Chart)
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailyTrend || []}>
                <defs>
                  <linearGradient id="colorHacim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121626',
                    borderColor: '#8b5cf6',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="hacim" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHacim)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 2: Pie Chart & Bar Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart: Kategori Dağılımı */}
          <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-[#0c101d] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <PieIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kategori Bazlı Harcama Dağılımı</h3>
                  <p className="text-xs text-gray-400">Ürün kategorilerine göre harcama yüzdeleri</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                Daire Grafik (Pie Chart)
              </span>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {data?.categoryAnalytics && data.categoryAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.categoryAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121626',
                        borderColor: '#10b981',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(val: any) => `₺${Number(val).toFixed(2)}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-500 text-sm">Kategori verisi bulunamadı.</div>
              )}
            </div>
          </div>

          {/* Bar Chart: En Çok Satılan Ürün Trendleri */}
          <div className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-[#0c101d] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Top Satış Yapan Ürünler</h3>
                  <p className="text-xs text-gray-400">En çok tercih edilen markalar ve ürün adetleri</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/30">
                Çubuk Grafik (Bar Chart)
              </span>
            </div>

            <div className="h-64 w-full">
              {data?.topProducts && data.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts}>
                    <XAxis dataKey="itemName" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121626',
                        borderColor: '#3b82f6',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="adet" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-500 text-sm flex items-center justify-center h-full">Ürün verisi bulunamadı.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Merchant Share Cards */}
        <div className="glass-card p-6 rounded-2xl border border-gray-800 bg-[#0c101d]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pazar Payına Göre Mağaza Kırılımı</h3>
              <p className="text-xs text-gray-400">Fiş okutulan zincir marketlerin ticari hacimleri</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.merchantShare && data.merchantShare.length > 0 ? (
              data.merchantShare.map((merch) => (
                <div
                  key={merch.name}
                  className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between hover:border-amber-500/30 transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{merch.name}</div>
                    <div className="text-xs text-gray-400">{merch.fişSayısı} İşlenmiş Fiş</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-amber-400">
                      ₺{merch.hacim.toFixed(2)}
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
