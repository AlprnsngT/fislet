'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Percent, DollarSign, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const AdminSettingsForm: React.FC = () => {
  const [cashbackType, setCashbackType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [cashbackValue, setCashbackValue] = useState<string>('10');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/v1/admin/config');
      const json = await res.json();
      if (json.success && json.config) {
        setCashbackType(json.config.cashbackType);
        setCashbackValue(String(json.config.cashbackValue));
      }
    } catch (e) {
      console.error('Config fetch error:', e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg(null);
    setConfigErrorMsg(null);

    try {
      const res = await fetch('/api/v1/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashbackType,
          cashbackValue: parseFloat(cashbackValue),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Ayarlar kaydedilemedi');
      }

      setConfigSuccessMsg(`Başarılı! Cashback ödül oranı ${cashbackType === 'PERCENTAGE' ? `%${cashbackValue}` : `₺${cashbackValue}`} olarak güncellendi.`);
      setTimeout(() => setConfigSuccessMsg(null), 4000);
    } catch (err: any) {
      setConfigErrorMsg(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">SİSTEM & CASHBACK AYARLARI</h2>
        <p className="text-xs text-gray-400">Fiş okutma sonucu verilecek puan ve cashback oranlarını dinamik olarak belirleyin</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-[#0c101d] shadow-2xl max-w-3xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fiş Ödül Hesaplama Kuralları</h3>
              <p className="text-xs text-gray-400">Kaydettiğiniz oranlar anında veritabanında güncellenir</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
            CANLI SENKRON
          </span>
        </div>

        {configSuccessMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold">{configSuccessMsg}</span>
          </div>
        )}

        {configErrorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{configErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-6">
          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">Hesaplama Modu Seçin</label>
            <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800 max-w-md">
              <button
                type="button"
                onClick={() => setCashbackType('PERCENTAGE')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                  cashbackType === 'PERCENTAGE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Yüzde Oranı (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setCashbackType('FIXED')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
                  cashbackType === 'FIXED' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Sabit Tutar (TL)</span>
              </button>
            </div>
          </div>

          {/* Input Value */}
          <div className="max-w-md">
            <label className="block text-xs font-bold text-gray-300 mb-2">
              {cashbackType === 'PERCENTAGE' ? 'Yüzde Oranı (%) (Şu an %10 Varsayılan)' : 'Sabit İade Tutarı (₺)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cashbackValue}
                onChange={(e) => setCashbackValue(e.target.value)}
                placeholder={cashbackType === 'PERCENTAGE' ? '10' : '15'}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-base font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="absolute right-4 top-3 text-base font-extrabold text-emerald-400">
                {cashbackType === 'PERCENTAGE' ? '%' : 'TL'}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="glass-button px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              {isSavingConfig ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
