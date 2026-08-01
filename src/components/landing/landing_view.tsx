'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Zap, ShieldCheck, ArrowRight, Sparkles, Receipt, Wallet, Award } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth_store';

export const LandingView: React.FC = () => {
  const { openAuthModal } = useAuthStore();

  const sliderItems = [
    { icon: Camera, title: 'Fişini Tara', desc: 'Alışveriş fişinin fotoğrafını çek veya yükle.', color: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Yapay Zeka OCR', desc: 'PaddleOCR ve Vision API ile anında doğrulama.', color: 'from-green-400 to-emerald-600' },
    { icon: Wallet, title: '%5 Cashback', desc: 'Fiş tutarının %5\'i anında cüzdanına yansısın.', color: 'from-teal-400 to-green-500' },
    { icon: ShieldCheck, title: 'Mükerrer Koruması', desc: 'SHA-256 composite hash ile %100 güvenli.', color: 'from-emerald-600 to-emerald-900' },
  ];

  return (
    <div className="relative min-h-screen bg-[#090d16] text-gray-100 flex flex-col justify-between overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            FISOKUT<span className="text-emerald-400">-KAZAN</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Giriş Yap
          </button>

          <button
            onClick={() => openAuthModal('register')}
            className="glass-button px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center space-x-1.5"
          >
            <span>Kayıt Ol</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-12 z-10 my-auto">
        {/* Left Column: Hero Text */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Türkiye'nin Akıllı Fiş Tarama & Nakit İade Platformu</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Alışveriş Fişlerini Okut, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500">
              Anında Cashback Kazan!
            </span>
          </h1>

          <p className="text-base text-gray-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Market, restoran ve alışveriş fişlerini kameranla tara; yapay zeka OCR motorumuz fişini anında doğrulasın ve harcamanın %5'ini cüzdanına iade etsin.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto glass-button px-8 py-4 rounded-2xl text-base font-extrabold text-white flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-transform"
            >
              <span>Kazanmaya Başla</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ücretsiz Kaydol • Kredi Kartı Gerekmez</span>
            </div>
          </div>
        </div>

        {/* Right Column: Diagonal Slider / Feature Marquee */}
        <div className="flex-1 w-full relative max-w-md lg:max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transform lg:rotate-[-3deg] lg:hover:rotate-0 transition-transform duration-500">
            {sliderItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-gray-900 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between text-xs text-gray-500 z-10">
        <p>© 2026 FISOKUT-KAZAN. Tüm hakları saklıdır.</p>
        <p className="mt-2 lg:mt-0">Yüksek başarım sunan Serverless PWA & OCR Mimari Altyapısı</p>
      </footer>
    </div>
  );
};
