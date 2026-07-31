'use client';

import React, { useState } from 'react';
import { CameraView } from '@/components/camera/camera_view';
import { WalletCard } from '@/components/wallet/wallet_card';
import { Receipt, CheckCircle, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [userId] = useState('usr_demo123');
  const [balance, setBalance] = useState(142.50);
  const [recentReceipts, setRecentReceipts] = useState([
    { id: '1', store: 'A101 Market', amount: 154.50, reward: 7.73, date: '31.07.2026', status: 'PROCESSED' },
    { id: '2', store: 'BİM Mağazacılık', amount: 240.00, reward: 12.00, date: '30.07.2026', status: 'PROCESSED' },
  ]);

  const handleScanComplete = (res: any) => {
    // Add simulated processed receipt to dashboard
    const newReceipt = {
      id: res.jobId || String(Date.now()),
      store: 'Migros Ticaret',
      amount: 180.00,
      reward: 9.00,
      date: new Date().toLocaleDateString('tr-TR'),
      status: 'PROCESSED',
    };
    setRecentReceipts((prev) => [newReceipt, ...prev]);
    setBalance((prev) => prev + 9.00);
  };

  return (
    <main className="min-h-screen pb-12 px-4 pt-6 max-w-md mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            <span>FISOKUT<span className="text-emerald-400">-KAZAN</span></span>
          </h1>
          <p className="text-xs text-gray-400">Fişini tara, anında cashback hesabına yatsın.</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
      </header>

      {/* Wallet Summary Card */}
      <WalletCard balance={balance} recentTransactionsCount={recentReceipts.length} />

      {/* Camera Capture Module */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-3 px-1 flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Canlı Fiş Taraması</span>
        </h2>
        <CameraView userId={userId} onScanComplete={handleScanComplete} />
      </section>

      {/* Recent Receipts List */}
      <section className="glass-card p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Son İşlenen Fişler</span>
          <span className="text-xs text-emerald-400 font-normal">{recentReceipts.length} Adet</span>
        </h3>

        <div className="space-y-3">
          {recentReceipts.map((item) => (
            <div key={item.id} className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.store}</h4>
                  <p className="text-xs text-gray-500">{item.date} • Tutar: ₺{item.amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400">+₺{item.reward.toFixed(2)}</span>
                <p className="text-[10px] text-gray-500">Kazanılan</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
