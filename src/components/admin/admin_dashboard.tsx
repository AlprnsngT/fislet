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
  Layers,
  Activity,
  Settings,
  Percent,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
}

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

export const AdminDashboardView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Chart Type Switcher state
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'pie'>('area');

  // Cashback Configuration State
  const [cashbackType, setCashbackType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [cashbackValue, setCashbackValue] = useState<string>('10');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

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

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/admin/config');
      const json = await res.json();
      if (json.success && json.config) {
        setCashbackType(json.config.cashbackType);
        setCashbackValue(String(json.config.cashbackValue));
      }
    } catch (e) {
      console.error('Config fetch error:', e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg(null);
    setConfigErrorMsg(null);

    try {
      const res = await fetch('/api/v1/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashbackType,
          cashbackValue: parseFloat(cashbackValue),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Ayarlar kaydedilemedi');
      }

      setConfigSuccessMsg(`Başarılı! Cashback oranı ${cashbackType === 'PERCENTAGE' ? `%${cashbackValue}` : `₺${cashbackValue}`} olarak güncellendi.`);
      setTimeout(() => setConfigSuccessMsg(null), 4000);
    } catch (err: any) {
      setConfigErrorMsg(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

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
                Canlı tüketici davranışları, dinamik cashback oran yönetimi & grafik paneli
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
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Ortalama Sepet (AOV)</span>
              <ShoppingBag className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400">
              ₺{data?.metrics.avgBasketSize.toFixed(2) || '0,00'}
            </div>
            <div className="text-xs text-gray-400 mt-2">Fiş başına ortalama sepet büyüklüğü</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d] shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Aktif Müşteri Hacmi</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              {data?.metrics.totalUsersCount || 0}
            </div>
            <div className="text-xs text-gray-400 mt-2">Sistemde kayıtlı aktif tüketici</div>
          </motion.div>
        </div>

        {/* SECTION: Admin Cashback Configuration Card */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-[#0c101d] shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sistem & Cashback Oran Ayarları</h3>
                <p className="text-xs text-gray-400">Fiş okutulduğunda kullanıcılara verilecek puan/cashback ödül oranını belirleyin</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              ADMIN ÖZEL
            </span>
          </div>

          {configSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-bold">{configSuccessMsg}</span>
            </div>
          )}

          {configErrorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{configErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Mode Switcher */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-2">Hesaplama Modu</label>
              <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setCashbackType('PERCENTAGE')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    cashbackType === 'PERCENTAGE'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Yüzde Oranı (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashbackType('FIXED')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    cashbackType === 'FIXED'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Sabit Tutar (TL)</span>
                </button>
              </div>
            </div>

            {/* Input Value */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-2">
                {cashbackType === 'PERCENTAGE' ? 'Yüzde Oranı (%) (Varsayılan %10)' : 'Sabit İade Tutarı (₺)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cashbackValue}
                  onChange={(e) => setCashbackValue(e.target.value)}
                  placeholder={cashbackType === 'PERCENTAGE' ? '10' : '15'}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="absolute right-4 top-2.5 text-sm font-extrabold text-emerald-400">
                  {cashbackType === 'PERCENTAGE' ? '%' : 'TL'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full glass-button py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                {isSavingConfig ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION: Category Analysis Cards */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Kategori Bazlı Geçen Ürün Kartları</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.categoryAnalytics && data.categoryAnalytics.length > 0 ? (
              data.categoryAnalytics.map((cat, idx) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-5 rounded-2xl border border-gray-800 bg-[#0c101d] hover:border-purple-500/40 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{cat.name}</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>

                  <div className="flex items-baseline justify-between mb-1">
                    <div className="text-2xl font-black text-white">{cat.quantity} Adet</div>
                    <div className="text-xs font-extrabold text-emerald-400">₺{cat.value.toFixed(2)}</div>
                  </div>

                  <div className="text-[11px] text-gray-400">
                    Toplam Harcama Payı: %
                    {(((cat.value || 0) / (data?.metrics.totalVolume || 1)) * 100).toFixed(1)}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-6 text-gray-500 text-sm">Kategori verisi bulunamadı.</div>
            )}
          </div>
        </div>

        {/* SECTION: Multi-Type Interactive Master Chart */}
        <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-[#0c101d] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Dinamik Pazarlama Grafiği</h3>
                <p className="text-xs text-gray-400">Sağdaki butonlardan grafik türünü anında değiştirin</p>
              </div>
            </div>

            {/* Interactive Chart Type Buttons */}
            <div className="flex items-center bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  chartType === 'area'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Alan (Area)</span>
              </button>

              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  chartType === 'line'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Çizgi (Line)</span>
              </button>

              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  chartType === 'bar'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Çubuk (Bar)</span>
              </button>

              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  chartType === 'pie'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Daire (Pie)</span>
              </button>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={data?.dailyTrend || []}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
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
                  <Area type="monotone" dataKey="hacim" name="Ticari Hacim (₺)" stroke="#8b5cf6" strokeWidth={3} fill="url(#areaColor)" />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={data?.dailyTrend || []}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121626',
                      borderColor: '#10b981',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line type="monotone" dataKey="fişSayısı" name="Fiş Adedi" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart data={data?.topProducts || []}>
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
                  <Bar dataKey="adet" name="Okutulma Adedi" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data?.categoryAnalytics || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data?.categoryAnalytics || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121626',
                      borderColor: '#ec4899',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => `₺${Number(val).toFixed(2)}`}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};
