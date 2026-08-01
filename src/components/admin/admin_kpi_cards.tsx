'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, DollarSign, ShoppingBag, Users } from 'lucide-react';

interface AdminKpiCardsProps {
  metrics?: {
    totalReceiptsCount: number;
    processedReceiptsCount: number;
    rejectedReceiptsCount: number;
    totalUsersCount: number;
    totalVolume: number;
    totalCashbackPaid: number;
    avgBasketSize: number;
  };
}

export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
      >
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Toplam Fiş Taraması</span>
          <FileCheck className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-3xl font-black text-white">{metrics?.totalReceiptsCount || 0}</div>
        <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
          <span className="text-emerald-400 font-bold">✓ {metrics?.processedReceiptsCount || 0} Onay</span>
          <span>•</span>
          <span className="text-red-400 font-bold">✕ {metrics?.rejectedReceiptsCount || 0} Red</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
      >
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Ticari Hacim</span>
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-3xl font-black text-emerald-400">
          ₺{metrics?.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0,00'}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Ödenen İade: <span className="text-emerald-300 font-bold">₺{metrics?.totalCashbackPaid.toFixed(2) || '0,00'}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
      >
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Ortalama Sepet (AOV)</span>
          <ShoppingBag className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-3xl font-black text-blue-400">
          ₺{metrics?.avgBasketSize.toFixed(2) || '0,00'}
        </div>
        <div className="text-xs text-gray-400 mt-2">Fiş başına ortalama sepet büyüklüğü</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121626] to-[#0c101d]"
      >
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Aktif Müşteri Hacmi</span>
          <Users className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-3xl font-black text-amber-400">{metrics?.totalUsersCount || 0}</div>
        <div className="text-xs text-gray-400 mt-2">Sistemde kayıtlı aktif tüketici</div>
      </motion.div>
    </div>
  );
};
