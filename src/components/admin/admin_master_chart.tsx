'use client';

import React from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface AdminChartsViewProps {
  dailyTrend?: Array<{ date: string; fişSayısı: number; hacim: number }>;
  topProducts?: Array<{ itemName: string; adet: number; tutar: number }>;
}

export const AdminMasterChart: React.FC<AdminChartsViewProps> = ({
  dailyTrend = [],
  topProducts = [],
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white">GRAFİKSEL RAPORLAR</h2>
        <p className="text-xs text-gray-400">Pazar ticari hacmi ve ürün okutulma adetlerinin zaman serisi grafikleri</p>
      </div>

      {/* 1. AREA CHART (Alan Grafiği: Ticari Hacim Trendi) */}
      <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-[#0c101d] shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-800/80 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ticari Hacim Trend Grafiği (Alan Grafiği)</h3>
            <p className="text-xs text-gray-400">Son 7 günlük günlük ciro tutarları</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend}>
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
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. BAR CHART (Çubuk Grafiği: Okutulma / Kalem Adetleri) */}
      <div className="glass-card p-6 rounded-2xl border border-blue-500/30 bg-[#0c101d] shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-800/80 pb-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">En Çok Geçen Ürün / Kalem Dağılımı (Çubuk Grafiği)</h3>
            <p className="text-xs text-gray-400">Fişlerden taranan ürün ve kategori adetleri</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <XAxis dataKey="itemName" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#3b82f6', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="adet" name="Okutulma Adedi" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
