'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Package,
  Search,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
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

interface ProductItem {
  id: string;
  itemName: string;
  categoryName: string;
  merchantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
}

interface AnalyticsData {
  metrics: {
    totalReceiptsCount: number;
    processedReceiptsCount: number;
    rejectedReceiptsCount: number;
    totalUsersCount: number;
    totalVolume: number;
    totalCashbackPaid: number;
    avgBasketSize: number;
    totalProductsCount: number;
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
  productsCatalog: ProductItem[];
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

  // Navigation Active Tab: 'analytics' | 'products' | 'settings'
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'settings'>('analytics');

  // Dynamic Chart Type Switcher state
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'pie'>('area');

  // Products Search State
  const [productSearch, setProductSearch] = useState('');

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

      setConfigSuccessMsg(`Başarılı! Cashback ödül oranı ${cashbackType === 'PERCENTAGE' ? `%${cashbackValue}` : `₺${cashbackValue}`} olarak güncellendi.`);
      setTimeout(() => setConfigSuccessMsg(null), 4000);
    } catch (err: any) {
      setConfigErrorMsg(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const filteredProducts = (data?.productsCatalog || []).filter(
    (p) =>
      p.itemName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.merchantName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 font-sans flex flex-col md:flex-row">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0c101d] border-r border-purple-500/20 flex flex-col justify-between p-5 flex-shrink-0">
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
                <span>Analiz & Grafikler</span>
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
                <span>Ürünlerim ({data?.metrics.totalProductsCount || 0})</span>
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

        {/* Sidebar Footer: Admin Profile & Logout */}
        <div className="pt-6 border-t border-gray-800/80 mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <div className="text-xs font-bold text-white">{user?.name || user?.username}</div>
              <div className="text-[10px] text-purple-400 font-mono">ROLE: {user?.role}</div>
            </div>
            <button
              onClick={fetchAnalytics}
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

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
        {/* TAB 1: ANALİZ & GRAFİKLER */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">B2B PAZARLAMA ANALİZİ</h2>
                <p className="text-xs text-gray-400">Veritabanından çekilen canlı tüketici eğilimleri & grafiksel pazar analizleri</p>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Toplam Fiş Taraması</span>
                  <FileCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-black text-white">{data?.metrics.totalReceiptsCount || 0}</div>
                <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold">✓ {data?.metrics.processedReceiptsCount || 0} Onay</span>
                  <span>•</span>
                  <span className="text-red-400 font-bold">✕ {data?.metrics.rejectedReceiptsCount || 0} Red</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]">
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
              </div>

              <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Ortalama Sepet (AOV)</span>
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-blue-400">
                  ₺{data?.metrics.avgBasketSize.toFixed(2) || '0,00'}
                </div>
                <div className="text-xs text-gray-400 mt-2">Fiş başına ortalama sepet büyüklüğü</div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Aktif Müşteri Hacmi</span>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400">{data?.metrics.totalUsersCount || 0}</div>
                <div className="text-xs text-gray-400 mt-2">Sistemde kayıtlı aktif tüketici</div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Kategori Bazlı Ürün Geçiş Kartları</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.categoryAnalytics && data.categoryAnalytics.length > 0 ? (
                  data.categoryAnalytics.map((cat, idx) => (
                    <div key={cat.name} className="glass-card p-5 rounded-2xl border border-gray-800 bg-[#0c101d] shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase">{cat.name}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      </div>
                      <div className="flex items-baseline justify-between mb-1">
                        <div className="text-2xl font-black text-white">{cat.quantity} Adet</div>
                        <div className="text-xs font-extrabold text-emerald-400">₺{cat.value.toFixed(2)}</div>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Pay: %{(((cat.value || 0) / (data?.metrics.totalVolume || 1)) * 100).toFixed(1)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-6 text-gray-500 text-sm">Kategori verisi bulunamadı.</div>
                )}
              </div>
            </div>

            {/* Interactive Master Chart */}
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

                <div className="flex items-center bg-gray-900/90 p-1.5 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      chartType === 'area' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                    <span>Alan</span>
                  </button>

                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      chartType === 'line' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Çizgi</span>
                  </button>

                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      chartType === 'bar' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Çubuk</span>
                  </button>

                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      chartType === 'pie' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <PieIcon className="w-3.5 h-3.5" />
                    <span>Daire</span>
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
                      <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#8b5cf6', borderRadius: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="hacim" name="Ticari Hacim (₺)" stroke="#8b5cf6" strokeWidth={3} fill="url(#areaColor)" />
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={data?.dailyTrend || []}>
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#10b981', borderRadius: '12px', color: '#fff' }} />
                      <Line type="monotone" dataKey="fişSayısı" name="Fiş Adedi" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={data?.topProducts || []}>
                      <XAxis dataKey="itemName" stroke="#6b7280" fontSize={11} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#3b82f6', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="adet" name="Okutulma Adedi" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie data={data?.categoryAnalytics || []} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                        {(data?.categoryAnalytics || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#ec4899', borderRadius: '12px', color: '#fff' }} formatter={(val: any) => `₺${Number(val).toFixed(2)}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ÜRÜNLERİM (PRODUCTS CATALOG) */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">ÜRÜNLERİM KATALOĞU</h2>
                <p className="text-xs text-gray-400">Fişlerden okutularak veritabanına yazılan tüm ürünlerin canlı listesi</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ürün, kategori veya marka ara..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden bg-[#0c101d] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900/90 text-gray-400 uppercase font-bold border-b border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4">Ürün Adı</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Mağaza / Marka</th>
                      <th className="py-3.5 px-4 text-center">Adet</th>
                      <th className="py-3.5 px-4 text-right">Birim Fiyat</th>
                      <th className="py-3.5 px-4 text-right">Toplam Fiyat</th>
                      <th className="py-3.5 px-4 text-right">Okutma Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-semibold text-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                            <Package className="w-4 h-4 text-purple-400" />
                            <span>{prod.itemName}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                              {prod.categoryName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-300">{prod.merchantName}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-white">{prod.quantity}</td>
                          <td className="py-3.5 px-4 text-right text-gray-400">₺{prod.unitPrice.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">₺{prod.totalPrice.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right text-gray-500 text-[11px]">
                            {new Date(prod.date).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                          Henüz okutulmuş ürün verisi bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SİSTEM AYARLARI */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">SİSTEM & CASHBACK AYARLARI</h2>
              <p className="text-xs text-gray-400">Fiş okutma sonucu verilecek puan ve cashback oranlarını dinamik olarak belirleyin</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-[#0c101d] shadow-2xl max-w-3xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Fiş Ödül Hesaplama Kuralları</h3>
                    <p className="text-xs text-gray-400">Kaydettiğiniz oranlar anında veritabanında güncellenir</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  CANLI SENKRON
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

              <form onSubmit={handleSaveConfig} className="space-y-6">
                {/* Mode Switcher */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">Hesaplama Modu Seçin</label>
                  <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800 max-w-md">
                    <button
                      type="button"
                      onClick={() => setCashbackType('PERCENTAGE')}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                        cashbackType === 'PERCENTAGE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      <span>Yüzde Oranı (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashbackType('FIXED')}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                        cashbackType === 'FIXED' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Sabit Tutar (TL)</span>
                    </button>
                  </div>
                </div>

                {/* Input Value */}
                <div className="max-w-md">
                  <label className="block text-xs font-bold text-gray-300 mb-2">
                    {cashbackType === 'PERCENTAGE' ? 'Yüzde Oranı (%) (Şu an %10 Varsayılan)' : 'Sabit İade Tutarı (₺)'}
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
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-base font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-4 top-3 text-base font-extrabold text-emerald-400">
                      {cashbackType === 'PERCENTAGE' ? '%' : 'TL'}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="glass-button px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
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
          </motion.div>
        )}
      </main>
    </div>
  );
};
