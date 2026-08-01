'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, ShieldCheck, Eye } from 'lucide-react';

export interface ReceiptDetailModalProps {
  receipt: any | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const isProcessed = receipt.status === 'PROCESSED';
  const isRejected = receipt.status === 'REJECTED';
  const isDuplicate = receipt.status === 'DUPLICATE';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-card rounded-3xl border border-emerald-500/30 overflow-hidden bg-[#0c101d] text-gray-100 p-6 space-y-6 my-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fiş & OCR Okuma Detayları</h3>
              <p className="text-xs text-gray-400">Görsel üzerinden tespit edilen ve doğrulanan veriler</p>
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isProcessed
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : isDuplicate
                ? 'bg-orange-950/60 border-orange-500/40 text-orange-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isProcessed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              ) : isDuplicate ? (
                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-extrabold">
                  {isProcessed
                    ? `Fiş Onaylandı (+₺${Number(receipt.cashbackAmount).toFixed(2)})`
                    : isDuplicate
                    ? 'Mükerrer Fiş (Zaten Kullanılmış)'
                    : 'Fiş Reddedildi'}
                </div>
                <div className="text-[11px] opacity-80">
                  {isProcessed
                    ? '%10 Cashback hesabınıza yüklendi'
                    : isDuplicate
                    ? 'Bu fiş daha önce sisteme taranmış'
                    : 'Görselde Toplam Tutar okunamadı'}
                </div>
              </div>
            </div>
          </div>

          {/* Image & Target Extracted Metadata Grid */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>🎯 Görsel Üzerinden Okunan Veriler</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px]">🎯 MAĞAZA / FİRMA</span>
                <div className="font-bold text-white truncate">{receipt.merchantName || 'Bilinmeyen Mağaza'}</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px]">🎯 VKN / TCKN</span>
                <div className="font-bold text-emerald-400">{receipt.vkn || 'Yok / Algılanmadı'}</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px]">🎯 FİŞ / Z NUMARASI</span>
                <div className="font-bold text-white">{receipt.receiptNo || 'Yok / Algılanmadı'}</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1">
                <span className="text-gray-400 text-[10px]">🎯 FİŞ TARİHİ</span>
                <div className="font-bold text-white">
                  {new Date(receipt.createdAt).toLocaleString('tr-TR')}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1 col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-[10px]">🎯 OKUNAN TOPLAM TUTAR</span>
                  <div className="text-base font-black text-white">₺{Number(receipt.totalAmount).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-[10px] font-bold">KAZANILAN İADE (%10)</span>
                  <div className="text-base font-black text-emerald-400">+₺{Number(receipt.cashbackAmount).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw OCR Line Breakdown */}
          {receipt.rawOcrText && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>📄 Ham OCR Okunan Satır Dökümü</span>
              </span>

              <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-[11px] font-mono text-gray-300 space-y-1 max-h-40 overflow-y-auto">
                {receipt.rawOcrText.split('\n').map((line: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
