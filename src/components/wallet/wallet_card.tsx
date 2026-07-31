'use client';

import React from 'react';
import { Wallet as WalletIcon, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  recentTransactionsCount: number;
}

export const WalletCard: React.FC<WalletCardProps> = ({ balance, recentTransactionsCount }) => {
  return (
    <div className="w-full glass-card p-6 rounded-3xl relative overflow-hidden border border-emerald-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Toplam Cüzdan Bakiyesi</span>
          </span>
          <h2 className="text-4xl font-extrabold text-white mt-1">
            ₺{balance.toFixed(2)}
          </h2>
        </div>
        
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <WalletIcon className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center space-x-1 text-emerald-400 font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>%5 Sabit Cashback Kazanımı</span>
        </div>
        <span>{recentTransactionsCount} İşlem</span>
      </div>
    </div>
  );
};
