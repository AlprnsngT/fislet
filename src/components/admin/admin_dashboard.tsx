'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminSidebar } from './admin_sidebar';
import { AdminKpiCards } from './admin_kpi_cards';
import { AdminCategoryCards } from './admin_category_cards';
import { AdminMasterChart } from './admin_master_chart';
import { AdminProductsTable, ProductItem } from './admin_products_table';
import { AdminSettingsForm } from './admin_settings_form';

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
  dailyTrend: Array<{ date: string; fişSayısı: number; hacim: number }>;
  categoryAnalytics: Array<{ name: string; value: number; quantity: number }>;
  topProducts: Array<{ itemName: string; adet: number; tutar: number }>;
  productsCatalog: ProductItem[];
  merchantShare: Array<{ name: string; fişSayısı: number; hacim: number }>;
}

export const AdminDashboardView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'settings'>('analytics');

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
    <div className="min-h-screen bg-[#070a12] text-gray-100 font-sans flex flex-col md:flex-row">
      {/* 1. Sidebar Navigation Component */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalProductsCount={data?.metrics.totalProductsCount || 0}
        loading={loading}
        onRefresh={fetchAnalytics}
      />

      {/* 2. Main Content View Area Orchestrating Decoupled SOLID Components */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
        {/* TAB 1: ANALİZ & GRAFİKLER */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white">B2B PAZARLAMA ANALİZİ</h2>
              <p className="text-xs text-gray-400">Veritabanından çekilen canlı tüketici eğilimleri & grafiksel pazar analizleri</p>
            </div>

            {/* KPI Stat Cards Component */}
            <AdminKpiCards metrics={data?.metrics} />

            {/* Category Breakdown Cards Component */}
            <AdminCategoryCards categories={data?.categoryAnalytics} totalVolume={data?.metrics.totalVolume} />

            {/* Interactive Master Chart Component */}
            <AdminMasterChart
              dailyTrend={data?.dailyTrend}
              topProducts={data?.topProducts}
              categoryAnalytics={data?.categoryAnalytics}
            />
          </motion.div>
        )}

        {/* TAB 2: ÜRÜNLERİM KATALOĞU */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Products Table Component */}
            <AdminProductsTable products={data?.productsCatalog} />
          </motion.div>
        )}

        {/* TAB 3: SİSTEM & CASHBACK AYARLARI */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Admin Settings Form Component */}
            <AdminSettingsForm />
          </motion.div>
        )}
      </main>
    </div>
  );
};
