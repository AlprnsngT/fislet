'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface CategoryAnalytic {
  name: string;
  value: number;
  quantity: number;
}

interface AdminCategoryCardsProps {
  categories?: CategoryAnalytic[];
  totalVolume?: number;
}

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

export const AdminCategoryCards: React.FC<AdminCategoryCardsProps> = ({ categories, totalVolume = 1 }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Layers className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Kategori Bazlı Ürün Geçiş Kartları</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories && categories.length > 0 ? (
          categories.map((cat, idx) => (
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
                Pay: %{(((cat.value || 0) / (totalVolume || 1)) * 100).toFixed(1)}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-6 text-gray-500 text-sm">Kategori verisi bulunamadı.</div>
        )}
      </div>
    </div>
  );
};
