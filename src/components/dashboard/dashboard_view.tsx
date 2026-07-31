'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from '@/components/camera/camera_view';
import { WalletCard } from '@/components/wallet/wallet_card';
import { useAuthStore } from '@/shared/stores/auth_store';
import { LogOut, Receipt, CheckCircle, Clock, ShieldCheck, Zap, Inbox } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [balance, setBalance] = useState<number>(0.0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWalletData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/wallet?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0.0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error loading wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleScanComplete = () => {
    // Refresh wallet and transaction history after new scan
    setTimeout(() => {
      fetchWalletData();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 pb-16 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Hoş Geldin</span>
          <h1 className="text-lg font-black text-white">{user?.name}</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-1 text-xs font-semibold"
          title="Çıkış Yap"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </header>

      {/* Wallet Card */}
      <WalletCard balance={balance} recentTransactionsCount={transactions.length} />

      {/* Camera / Scan Module */}
      <section className="glass-card p-4 rounded-3xl border border-emerald-500/20">
        <CameraView userId={user?.id || ''} onScanComplete={handleScanComplete} />
      </section>

      {/* Recent Transactions Section */}
      <section className="glass-card p-5 rounded-3xl space-y-4 border border-gray-800">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Son İşlemleriniz</span>
          <span className="text-xs text-emerald-400 font-normal">{transactions.length} İşlem</span>
        </h3>

        {transactions.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-gray-800 rounded-2xl">
            <Inbox className="w-8 h-8 text-gray-600" />
            <p className="text-xs text-gray-400">Henüz taranmış bir fişiniz bulunmuyor.</p>
            <p className="text-[10px] text-gray-500">Yukarıdaki kamera veya dosya yükleme alanından fişinizi gönderebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{tx.description || 'Fiş Ödülü'}</h4>
                    <p className="text-[10px] text-gray-500">
                      {new Date(tx.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-400">+₺{Number(tx.amount).toFixed(2)}</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Cashback</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
