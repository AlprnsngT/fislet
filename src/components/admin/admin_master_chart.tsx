'use client';

import React, { useState } from 'react';
import {
  Activity,
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieIcon,
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

interface AdminMasterChartProps {
  dailyTrend?: Array<{ date: string; fişSayısı: number; hacim: number }>;
  topProducts?: Array<{ itemName: string; adet: number; tutar: number }>;
  categoryAnalytics?: Array<{ name: string; value: number; quantity: number }>;
}

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

export const AdminMasterChart: React.FC<AdminMasterChartProps> = ({
  dailyTrend = [],
  topProducts = [],
  categoryAnalytics = [],
}) => {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'pie'>('area');

  return (
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

        {/* Interactive Chart Type Switcher */}
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
          ) : chartType === 'line' ? (
            <LineChart data={dailyTrend}>
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#10b981', borderRadius: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="fişSayısı" name="Fiş Adedi" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={topProducts}>
              <XAxis dataKey="itemName" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#121626', borderColor: '#3b82f6', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="adet" name="Okutulma Adedi" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={categoryAnalytics} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                {categoryAnalytics.map((entry, index) => (
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
  );
};
