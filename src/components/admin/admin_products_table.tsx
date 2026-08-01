'use client';

import React, { useState } from 'react';
import { Package, Search } from 'lucide-react';

export interface ProductItem {
  id: string;
  itemName: string;
  categoryName: string;
  merchantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
}

interface AdminProductsTableProps {
  products?: ProductItem[];
}

export const AdminProductsTable: React.FC<AdminProductsTableProps> = ({ products = [] }) => {
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.itemName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.merchantName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">ÜRÜNLERİM KATALOĞU</h2>
          <p className="text-xs text-gray-400">Fişlerden okutularak veritabanına yazılan tüm ürünlerin canlı listesi</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Ürün, kategori veya marka ara..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden bg-[#0c101d] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/90 text-gray-400 uppercase font-bold border-b border-gray-800">
              <tr>
                <th className="py-3.5 px-4">Ürün Adı</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Mağaza / Marka</th>
                <th className="py-3.5 px-4 text-center">Adet</th>
                <th className="py-3.5 px-4 text-right">Birim Fiyat</th>
                <th className="py-3.5 px-4 text-right">Toplam Fiyat</th>
                <th className="py-3.5 px-4 text-right">Okutma Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-semibold text-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span>{prod.itemName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                        {prod.categoryName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">{prod.merchantName}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-white">{prod.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-gray-400">₺{prod.unitPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">₺{prod.totalPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right text-gray-500 text-[11px]">
                      {new Date(prod.date).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                    Henüz okutulmuş ürün verisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
