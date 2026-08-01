'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface AdminChartsViewProps {
  dailyTrend?: Array<{ date: string; fişSayısı: number; hacim: number }>;
}

export const AdminMasterChart: React.FC<AdminChartsViewProps> = ({ dailyTrend = [] }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">GRAFİKSEL RAPORLAR</h2>
        <p className="text-xs text-gray-400">Pazar ticari hacminin zamana göre değişim grafiği</p>
      </div>

      {/* AREA CHART ONLY (Alan Grafiği: Ticari Hacim Trendi) */}
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

        <div className="h-80 w-full pt-2">
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
    </div>
  );
};
