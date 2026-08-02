import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Layers,
  FileSpreadsheet,
  BarChart3,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TransactionItem {
  id?: string | number;
  Tanggal: string;
  Nama?: string;
  Tipe?: string;
  Jenis?: string;
  Metode?: string;
  Pemasukan?: number | string;
  HargaModal?: number | string;
  Nominal?: number | string;
  Laba?: number | string;
  Keterangan?: string;
  [key: string]: any;
}

interface AdminCashFlowPageProps {
  salesTransactions?: TransactionItem[];
  savingsTransactions?: TransactionItem[];
  debtTransactions?: TransactionItem[];
  investmentTransactions?: TransactionItem[];
}

// Helper to safely parse numbers
const parseNum = (val: any): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper to parse dates
const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date(0);
  try {
    const parts = dateStr.trim().split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';

    if (datePart.includes('-')) {
      const [y, m, d] = datePart.split('-').map(Number);
      const [hh, mm, ss] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
    } else if (datePart.includes('/')) {
      const [d, m, y] = datePart.split('/').map(Number);
      const [hh, mm, ss] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
    }
  } catch (e) {
    // fallback
  }
  return new Date(dateStr) || new Date(0);
};

export const AdminCashFlowPage: React.FC<AdminCashFlowPageProps> = ({
  salesTransactions = [],
  savingsTransactions = [],
  debtTransactions = [],
  investmentTransactions = []
}) => {
  const navigate = useNavigate();

  // Page Sub-Tab: 'ringkasan' | 'rincian'
  const [activeSubTab, setActiveSubTab] = useState<'ringkasan' | 'rincian'>('ringkasan');

  // Filters
  const [timeFilter, setTimeFilter] = useState<'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'tahun_ini' | 'semua'>('bulan_ini');
  const [categoryFilter, setCategoryFilter] = useState<'semua' | 'penjualan' | 'tabungan' | 'hutang' | 'investasi'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [flowDirectionFilter, setFlowDirectionFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');

  // Standardize all transactions into a unified mapped list
  const unifiedMappedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      rawDate: Date;
      dateStr: string;
      category: 'Penjualan' | 'Tabungan' | 'Hutang / Piutang' | 'Investasi';
      title: string;
      customerName: string;
      metodeDetail: string;
      flowType: 'PEMASUKAN' | 'PENGELUARAN';
      amountInflow: number;
      amountOutflow: number;
      netAmount: number; // positive for inflow, negative for outflow
      keterangan: string;
    }> = [];

    // 1. Sales Transactions
    salesTransactions.forEach((t, idx) => {
      const d = parseDate(t.Tanggal);
      const pemasukan = parseNum(t.Pemasukan);
      const modal = parseNum(t.HargaModal);

      // Inflow from sales
      if (pemasukan > 0) {
        list.push({
          id: `sales-in-${t.id || idx}`,
          rawDate: d,
          dateStr: t.Tanggal || '',
          category: 'Penjualan',
          title: `Penjualan ${t.Jenis || 'Barang / Jasa'}`,
          customerName: t.Nama || 'Umum',
          metodeDetail: t.Metode || 'Tunai',
          flowType: 'PEMASUKAN',
          amountInflow: pemasukan,
          amountOutflow: 0,
          netAmount: pemasukan,
          keterangan: t.Keterangan || `Pendapatan Penjualan`
        });
      }

      // Outflow for Modal / HPP
      if (modal > 0) {
        list.push({
          id: `sales-out-${t.id || idx}`,
          rawDate: d,
          dateStr: t.Tanggal || '',
          category: 'Penjualan',
          title: `Modal / HPP (${t.Jenis || 'Penjualan'})`,
          customerName: t.Nama || 'Umum',
          metodeDetail: t.Metode || 'Tunai',
          flowType: 'PENGELUARAN',
          amountInflow: 0,
          amountOutflow: modal,
          netAmount: -modal,
          keterangan: `Harga Modal Penjualan`
        });
      }
    });

    // 2. Savings Transactions
    savingsTransactions.forEach((s, idx) => {
      const d = parseDate(s.Tanggal || (s as any).tanggal);
      const nominal = parseNum(
        (s as any).Nominal !== undefined ? (s as any).Nominal :
        (s as any).Jumlah !== undefined ? (s as any).Jumlah :
        (s as any).nominal !== undefined ? (s as any).nominal :
        (s as any).jumlah !== undefined ? (s as any).jumlah : 0
      );
      const tipeUpper = String(s.Tipe || (s as any).tipe || (s as any).type || '').toUpperCase();
      const isSetor = tipeUpper === 'SETOR' || tipeUpper === 'MASUK' || tipeUpper.includes('SETOR');

      if (nominal > 0) {
        if (isSetor) {
          list.push({
            id: `sav-${s.id || idx}`,
            rawDate: d,
            dateStr: s.Tanggal || (s as any).tanggal || '',
            category: 'Tabungan',
            title: `Setoran Tabungan`,
            customerName: s.Nama || (s as any).nama || 'Nasabah',
            metodeDetail: s.Metode || (s as any).metode || 'Tunai',
            flowType: 'PEMASUKAN',
            amountInflow: nominal,
            amountOutflow: 0,
            netAmount: nominal,
            keterangan: s.Keterangan || (s as any).keterangan || `Setoran Tabungan Pelanggan`
          });
        } else {
          list.push({
            id: `sav-${s.id || idx}`,
            rawDate: d,
            dateStr: s.Tanggal || (s as any).tanggal || '',
            category: 'Tabungan',
            title: `Penarikan Tabungan`,
            customerName: s.Nama || (s as any).nama || 'Nasabah',
            metodeDetail: s.Metode || (s as any).metode || 'Tunai',
            flowType: 'PENGELUARAN',
            amountInflow: 0,
            amountOutflow: nominal,
            netAmount: -nominal,
            keterangan: s.Keterangan || (s as any).keterangan || `Penarikan Tabungan Pelanggan`
          });
        }
      }
    });

    // 3. Debt Transactions
    debtTransactions.forEach((db, idx) => {
      const d = parseDate(db.Tanggal || (db as any).tanggal);
      const nominal = parseNum(
        (db as any).Jumlah !== undefined && (db as any).Jumlah !== null && (db as any).Jumlah !== '' ? (db as any).Jumlah :
        (db as any).Nominal !== undefined && (db as any).Nominal !== null && (db as any).Nominal !== '' ? (db as any).Nominal :
        (db as any).jumlah !== undefined ? (db as any).jumlah :
        (db as any).nominal !== undefined ? (db as any).nominal :
        (db as any).NominalTransaksi !== undefined ? (db as any).NominalTransaksi :
        (db as any).nominal_transaksi !== undefined ? (db as any).nominal_transaksi :
        (db as any).Pemasukan !== undefined ? (db as any).Pemasukan : 0
      );
      const tipeUpper = String(db.Tipe || (db as any).tipe || (db as any).type || (db as any).Jenis || (db as any).jenis || '').toUpperCase();
      const isPayment = tipeUpper === 'BAYAR' || tipeUpper === 'LUNAS' || tipeUpper === 'PEMBAYARAN' || tipeUpper === 'SETOR' || tipeUpper.includes('BAYAR') || tipeUpper.includes('LUNAS');

      if (nominal > 0) {
        if (isPayment) {
          list.push({
            id: `debt-${db.id || (db as any).id_hutang || idx}`,
            rawDate: d,
            dateStr: db.Tanggal || (db as any).tanggal || '',
            category: 'Hutang / Piutang',
            title: `Pembayaran Kasbon / Piutang`,
            customerName: db.Nama || (db as any).nama || 'Pelanggan',
            metodeDetail: db.Metode || (db as any).metode || 'Tunai',
            flowType: 'PEMASUKAN',
            amountInflow: nominal,
            amountOutflow: 0,
            netAmount: nominal,
            keterangan: db.Keterangan || (db as any).keterangan || `Pelunasan / Bayar Kasbon`
          });
        } else {
          list.push({
            id: `debt-${db.id || (db as any).id_hutang || idx}`,
            rawDate: d,
            dateStr: db.Tanggal || (db as any).tanggal || '',
            category: 'Hutang / Piutang',
            title: `Pemberian Kasbon (Piutang)`,
            customerName: db.Nama || (db as any).nama || 'Pelanggan',
            metodeDetail: db.Metode || (db as any).metode || 'Tunai',
            flowType: 'PENGELUARAN',
            amountInflow: 0,
            amountOutflow: nominal,
            netAmount: -nominal,
            keterangan: db.Keterangan || (db as any).keterangan || `Tambah Kasbon Pelanggan`
          });
        }
      }
    });

    // 4. Investment Transactions
    investmentTransactions.forEach((inv, idx) => {
      const d = parseDate(inv.Tanggal || (inv as any).tanggal);
      const nominal = parseNum(
        (inv as any).Nominal !== undefined ? (inv as any).Nominal :
        (inv as any).Jumlah !== undefined ? (inv as any).Jumlah :
        (inv as any).nominal !== undefined ? (inv as any).nominal :
        (inv as any).jumlah !== undefined ? (inv as any).jumlah : 0
      );
      const tipeUpper = String(inv.Tipe || (inv as any).tipe || (inv as any).type || '').toUpperCase();

      if (nominal > 0) {
        const isDeposit = tipeUpper === 'SETOR' || tipeUpper === 'MASUK' || tipeUpper === 'INVESTASI' || tipeUpper.includes('SETOR') || tipeUpper.includes('INVESTASI');
        list.push({
          id: `inv-${inv.id || idx}`,
          rawDate: d,
          dateStr: inv.Tanggal || '',
          category: 'Investasi',
          title: isDeposit ? `Suntikan Modal / Investasi` : `Penarikan Capital / Investasi`,
          customerName: inv.Nama || 'Investor/Owner',
          metodeDetail: inv.Metode || 'Tunai',
          flowType: isDeposit ? 'PEMASUKAN' : 'PENGELUARAN',
          amountInflow: isDeposit ? nominal : 0,
          amountOutflow: isDeposit ? 0 : nominal,
          netAmount: isDeposit ? nominal : -nominal,
          keterangan: inv.Keterangan || `Transaksi Investasi`
        });
      }
    });

    return list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [salesTransactions, savingsTransactions, debtTransactions, investmentTransactions]);

  // Apply Time Period Filter
  const timeFilteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return unifiedMappedTransactions.filter(item => {
      const d = item.rawDate;
      const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (timeFilter === 'hari_ini') {
        return targetDate.getTime() === today.getTime();
      }
      if (timeFilter === 'minggu_ini') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return targetDate >= startOfWeek && targetDate <= today;
      }
      if (timeFilter === 'bulan_ini') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'tahun_ini') {
        return d.getFullYear() === now.getFullYear();
      }
      return true; // 'semua'
    });
  }, [unifiedMappedTransactions, timeFilter]);

  // Aggregations
  const cashFlowSummary = useMemo(() => {
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    const categoryStats: Record<string, {
      totalInflow: number;
      totalOutflow: number;
      net: number;
    }> = {
      'Penjualan': { totalInflow: 0, totalOutflow: 0, net: 0 },
      'Tabungan': { totalInflow: 0, totalOutflow: 0, net: 0 },
      'Hutang / Piutang': { totalInflow: 0, totalOutflow: 0, net: 0 },
      'Investasi': { totalInflow: 0, totalOutflow: 0, net: 0 }
    };

    timeFilteredTransactions.forEach(item => {
      totalPemasukan += item.amountInflow;
      totalPengeluaran += item.amountOutflow;

      if (categoryStats[item.category]) {
        categoryStats[item.category].totalInflow += item.amountInflow;
        categoryStats[item.category].totalOutflow += item.amountOutflow;
        categoryStats[item.category].net += item.netAmount;
      }
    });

    const grandNet = totalPemasukan - totalPengeluaran;

    return {
      totalPemasukan,
      totalPengeluaran,
      grandNet,
      categoryStats
    };
  }, [timeFilteredTransactions]);

  // Daily Chart Data for Recharts
  const chartDataByDate = useMemo(() => {
    const map: Record<string, {
      date: string;
      pemasukan: number;
      pengeluaran: number;
      net: number;
    }> = {};

    timeFilteredTransactions.forEach(item => {
      const dateKey = item.dateStr.split(' ')[0] || 'Lainnya';
      if (!map[dateKey]) {
        map[dateKey] = {
          date: dateKey,
          pemasukan: 0,
          pengeluaran: 0,
          net: 0
        };
      }

      map[dateKey].pemasukan += item.amountInflow;
      map[dateKey].pengeluaran += item.amountOutflow;
      map[dateKey].net += item.netAmount;
    });

    return Object.values(map).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  }, [timeFilteredTransactions]);

  // Apply All User Filters on Table List
  const displayedTableTransactions = useMemo(() => {
    return timeFilteredTransactions.filter(item => {
      // Category filter
      if (categoryFilter === 'penjualan' && item.category !== 'Penjualan') return false;
      if (categoryFilter === 'tabungan' && item.category !== 'Tabungan') return false;
      if (categoryFilter === 'hutang' && item.category !== 'Hutang / Piutang') return false;
      if (categoryFilter === 'investasi' && item.category !== 'Investasi') return false;

      // Flow direction filter
      if (flowDirectionFilter === 'pemasukan' && item.flowType !== 'PEMASUKAN') return false;
      if (flowDirectionFilter === 'pengeluaran' && item.flowType !== 'PENGELUARAN') return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchMetode = item.metodeDetail.toLowerCase().includes(q);
        const matchKet = item.keterangan.toLowerCase().includes(q);
        if (!matchTitle && !matchCustomer && !matchMetode && !matchKet) return false;
      }

      return true;
    });
  }, [timeFilteredTransactions, categoryFilter, flowDirectionFilter, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 text-slate-800 dark:text-slate-100"
    >
      {/* Top Banner Header */}
      <div className="bg-[#005E6A] text-white px-4 sm:px-8 pt-8 pb-16 relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-black uppercase tracking-wider transition-all backdrop-blur-md mb-2 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  Laporan Arus Kas
                </h1>
                <p className="text-xs font-medium text-teal-100/80 uppercase tracking-widest">
                  Ringkasan & Detail Transaksi Arus Kas Real-time
                </p>
              </div>
            </div>
          </div>

          {/* Time Period Filter Tabs */}
          <div className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md flex items-center gap-1 overflow-x-auto no-scrollbar border border-white/15">
            {[
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: 'minggu_ini', label: 'Minggu Ini' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'tahun_ini', label: 'Tahun Ini' },
              { id: 'semua', label: 'Semua Data' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  timeFilter === tab.id
                    ? 'bg-amber-400 text-slate-900 shadow-md scale-[1.02]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area with Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 space-y-8 relative z-20">
        
        {/* Navigation Sub-Tabs: Ringkasan vs Rincian */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('ringkasan')}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'ringkasan'
                  ? 'bg-[#005E6A] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ringkasan</span>
            </button>

            <button
              onClick={() => setActiveSubTab('rincian')}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'rincian'
                  ? 'bg-[#005E6A] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Rincian</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 px-4 py-1 text-xs font-bold text-slate-400">
            <span>Filter Periode: <strong className="text-[#005E6A] dark:text-teal-400 uppercase">{timeFilter.replace('_', ' ')}</strong></span>
          </div>
        </div>

        {/* TAB 1: RINGKASAN */}
        {activeSubTab === 'ringkasan' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Main Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Total Pemasukan */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-12 -mt-12 pointer-events-none transition-transform group-hover:scale-110" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                          Total Pemasukan
                        </span>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Semua Arus Kas Masuk</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider rounded-md">
                      MASUK
                    </span>
                  </div>

                  <div className="my-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-0.5">
                      Pemasukan Periode Ini
                    </p>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                      Rp {cashFlowSummary.totalPemasukan.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Pengeluaran */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-rose-100 dark:border-rose-900/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-900/10 rounded-full -mr-12 -mt-12 pointer-events-none transition-transform group-hover:scale-110" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center shadow-sm">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 block">
                          Total Pengeluaran
                        </span>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Semua Arus Kas Keluar</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[9px] font-black uppercase tracking-wider rounded-md">
                      KELUAR
                    </span>
                  </div>

                  <div className="my-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-0.5">
                      Pengeluaran Periode Ini
                    </p>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
                      Rp {cashFlowSummary.totalPengeluaran.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Surplus / Defisit */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-teal-100 dark:border-teal-900/30 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 dark:bg-teal-900/10 rounded-full -mr-12 -mt-12 pointer-events-none transition-transform group-hover:scale-110" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/60 text-[#005E6A] dark:text-teal-400 rounded-lg flex items-center justify-center shadow-sm">
                        {cashFlowSummary.grandNet >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#005E6A] dark:text-teal-400 block">
                          Surplus / Defisit
                        </span>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Total Net Arus Kas</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${
                      cashFlowSummary.grandNet >= 0
                        ? 'bg-teal-100 dark:bg-teal-900/40 text-[#005E6A] dark:text-teal-300'
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                    }`}>
                      {cashFlowSummary.grandNet >= 0 ? 'SURPLUS' : 'DEFISIT'}
                    </span>
                  </div>

                  <div className="my-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-0.5">
                      Jumlah Surplus / Defisit
                    </p>
                    <p className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
                      cashFlowSummary.grandNet >= 0 ? 'text-[#005E6A] dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {cashFlowSummary.grandNet >= 0 ? '+' : ''}Rp {cashFlowSummary.grandNet.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Mapping Breakdown by Category & Visual Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-400">
                      Rincian Kategori Sumber Arus Kas
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                      Penjualan, Tabungan, Hutang & Investasi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab('rincian')}
                  className="px-4 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-[#005E6A] dark:text-teal-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <span>Lihat Rincian Transaksi &rarr;</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Category Breakdown Cards */}
                <div className="space-y-4">
                  {(Object.entries(cashFlowSummary.categoryStats) as [string, { totalInflow: number; totalOutflow: number; net: number }][]).map(([catName, stats]) => {
                    const netVal = stats.net;
                    return (
                      <div
                        key={catName}
                        className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#005E6A]" />
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {catName}
                            </h3>
                          </div>
                          <span className={`text-xs font-black tabular-nums px-2.5 py-1 rounded-lg ${
                            netVal >= 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                          }`}>
                            Net: {netVal >= 0 ? '+' : ''}Rp {netVal.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {/* Pemasukan */}
                          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
                            <p className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                              Pemasukan
                            </p>
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                              +Rp {stats.totalInflow.toLocaleString('id-ID')}
                            </p>
                          </div>

                          {/* Pengeluaran */}
                          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100/60 dark:border-rose-900/30">
                            <p className="text-[9px] font-black uppercase text-rose-800 dark:text-rose-300">
                              Pengeluaran
                            </p>
                            <p className="text-xs font-black text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
                              -Rp {stats.totalOutflow.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Time Trend Bar Chart */}
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#005E6A]" />
                      Grafik Arus Kas Harian (Pemasukan vs Pengeluaran)
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataByDate} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v) => `Rp${(v/1000).toFixed(0)}k`} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-700">
                                    <p className="font-black text-amber-300 uppercase">{label}</p>
                                    <p className="text-emerald-400 font-bold">Pemasukan: Rp {d.pemasukan.toLocaleString('id-ID')}</p>
                                    <p className="text-rose-400 font-bold">Pengeluaran: Rp {d.pengeluaran.toLocaleString('id-ID')}</p>
                                    <p className="text-teal-300 font-black pt-1 border-t border-slate-800">Surplus/Defisit: Rp {d.net.toLocaleString('id-ID')}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: RINCIAN */}
        {activeSubTab === 'rincian' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-[#005E6A] dark:text-teal-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#005E6A]" />
                  Rincian Transaksi Arus Kas
                </h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-0.5">
                  {displayedTableTransactions.length} Transaksi Terdaftar dalam Filter Ini
                </p>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black uppercase px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="semua">Semua Kategori</option>
                  <option value="penjualan">Penjualan</option>
                  <option value="tabungan">Tabungan</option>
                  <option value="hutang">Hutang / Piutang</option>
                  <option value="investasi">Investasi</option>
                </select>

                {/* Direction Filter */}
                <select
                  value={flowDirectionFilter}
                  onChange={(e) => setFlowDirectionFilter(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black uppercase px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="semua">Pemasukan & Pengeluaran</option>
                  <option value="pemasukan">Hanya Pemasukan (+)</option>
                  <option value="pengeluaran">Hanya Pengeluaran (-)</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi berdasarkan nama pelanggan, judul, atau keterangan..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-[#005E6A] transition-colors"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-100 dark:border-slate-700">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4">Tanggal & Waktu</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Deskripsi & Pelanggan</th>
                    <th className="p-4">Metode</th>
                    <th className="p-4 text-right">Nominal Arus Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {displayedTableTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                        Tidak ada transaksi yang cocok dengan kriteria filter Anda.
                      </td>
                    </tr>
                  ) : (
                    displayedTableTransactions.map(item => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">
                          {item.dateStr}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#005E6A] dark:text-teal-300 font-black text-[10px] uppercase tracking-wider">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-4">
                          <p className="font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">
                            {item.customerName} • {item.keterangan}
                          </p>
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            <CreditCard className="w-3 h-3" />
                            {item.metodeDetail}
                          </span>
                        </td>

                        <td className="p-4 text-right font-black tabular-nums whitespace-nowrap">
                          {item.flowType === 'PEMASUKAN' ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +Rp {item.amountInflow.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400">
                              -Rp {item.amountOutflow.toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
