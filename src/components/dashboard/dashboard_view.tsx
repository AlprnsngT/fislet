'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from '@/components/camera/camera_view';
import { WalletCard } from '@/components/wallet/wallet_card';
import { ReceiptDetailModal } from '@/components/receipts/receipt_detail_modal';
import { useAuthStore } from '@/shared/stores/auth_store';
import { LogOut, CheckCircle, Clock, AlertTriangle, XCircle, Inbox, RefreshCw, Eye } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [balance, setBalance] = useState<number>(0.0);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // 1. Fetch wallet balance
      const walletRes = await fetch(`/api/v1/wallet?userId=${user.id}`);
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setBalance(walletData.balance || 0.0);
      }

      // 2. Fetch receipts history & statuses
      const receiptsRes = await fetch(`/api/v1/receipts/my-receipts?userId=${user.id}`);
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json();
        setReceipts(receiptsData.receipts || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleScanComplete = () => {
    fetchUserData();
    setTimeout(() => {
      fetchUserData();
    }, 2500);
  };

  const getStatusBadge = (status: string, cashbackAmount: number) => {
    switch (status) {
      case 'PROCESSED':
        return {
          label: `Onaylandı (+₺${cashbackAmount.toFixed(2)})`,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle,
        };
      case 'PENDING':
        return {
          label: 'İnceleniyor (OCR İşleniyor...)',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Clock,
        };
      case 'REJECTED':
        return {
          label: 'Reddedildi (Tutar Okunamadı)',
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: XCircle,
        };
      case 'DUPLICATE':
        return {
          label: 'Mükerrer Fiş (Zaten Kullanılmış)',
          color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'İşleniyor',
          color: 'bg-gray-800 text-gray-300 border-gray-700',
          icon: Clock,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-gray-100 pb-16 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header with App Logo */}
      <header className="flex justify-between items-center bg-gray-900/80 p-4 rounded-2xl border border-gray-800 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <img src="/Logo.png" alt="FisOkut Logo" className="w-10 h-10 object-contain rounded-lg" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Hoş Geldin</span>
            <h1 className="text-base font-black text-white">{user?.name || user?.username}</h1>
            <p className="text-[11px] text-gray-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-1 text-xs font-semibold"
          title="Çıkış Yap"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </header>

      {/* Wallet Card */}
      <WalletCard balance={balance} recentTransactionsCount={receipts.filter(r => r.status === 'PROCESSED').length} />

      {/* Camera / Scan Module */}
      <section className="glass-card p-4 rounded-3xl border border-emerald-500/20">
        <CameraView userId={user?.id || ''} onScanComplete={handleScanComplete} />
      </section>

      {/* Receipts History & Status Section */}
      <section className="glass-card p-5 rounded-3xl space-y-4 border border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Fiş Durumlarınız & Geçmiş</h3>
            <p className="text-[10px] text-gray-400">Okunan verileri görmek için fiş kartına tıklayın</p>
          </div>
          <button
            onClick={fetchUserData}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-gray-800 rounded-2xl">
            <Inbox className="w-8 h-8 text-gray-600" />
            <p className="text-xs text-gray-400">Henüz taranmış bir fişiniz bulunmuyor.</p>
            <p className="text-[10px] text-gray-500">Yukarıdaki alandan fişinizi kameranızla çekip gönderebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((item) => {
              const badge = getStatusBadge(item.status, item.cashbackAmount);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedReceipt(item)}
                  className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-emerald-500/40 cursor-pointer transition-all flex justify-between items-center group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badge.color}`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center space-x-1">
                        <span>{item.merchantName || (item.status === 'PROCESSED' ? `Fiş No: ${item.receiptNo}` : 'Gönderilen Görsel')}</span>
                        <Eye className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {new Date(item.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Receipt Detail & Inspection Modal */}
      <ReceiptDetailModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
