import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  PlusCircle, 
  ShieldCheck, 
  Calendar, 
  Receipt, 
  Info, 
  ExternalLink,
  AlertTriangle 
} from "lucide-react";
import { Customer, DebtTransaction, SalesTransaction } from "../App";

const formatCurrency = (val: number | string | undefined) => {
  if (val === undefined || val === null) return "0";
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, '')) || 0;
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getIsEdcBni = (melalui?: string) => {
  return melalui?.trim().toUpperCase() === "EDC BNI";
};

const getIsCashOut = (jenis: string) => {
  const upperJenis = jenis.trim().toUpperCase();
  const cashOutServices = ["TARIK TUNAI", "PKH", "BPNT"];
  return cashOutServices.some(service => 
    upperJenis === service || upperJenis.startsWith(service) || upperJenis.includes(service)
  );
};

const parseItems = (jenis: string, total: number, hargaModal?: number, melalui?: string) => {
  const upperJenis = jenis.trim().toUpperCase();
  const isEdcBni = getIsEdcBni(melalui);

  if (isEdcBni && hargaModal !== undefined && hargaModal > 0) {
    const modal = hargaModal;
    const adminFee = total - (modal + 1500);
    const items = [
      { qty: 1, name: jenis, price: total },
      { qty: 1, name: "BIAYA EDC", price: 3000 }
    ];
    if (adminFee > 0) {
      items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
    }
    return items;
  }

  const specialServices = ["QRIS", "TRANSFER", "TOPUP DANA", "TOPUP OVO", "TOPUP GOPAY", "TOPUP SHOPEEPAY"];
  const isSpecial = specialServices.some(service => 
    upperJenis === service || upperJenis.startsWith(service) || upperJenis.includes(service)
  );

  if (isSpecial && hargaModal !== undefined && hargaModal > 0) {
    const modal = hargaModal;
    const adminFee = total - modal;
    const items = [
      { qty: 1, name: jenis, price: modal }
    ];
    if (adminFee > 0) {
      items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
    }
    return items;
  }

  const isCashOut = getIsCashOut(jenis);
  if (isCashOut && hargaModal !== undefined && hargaModal > 0) {
    const modal = hargaModal;
    const adminFee = total - modal;
    const items = [
      { qty: 1, name: jenis, price: total }
    ];
    if (adminFee > 0) {
      items.push({ qty: 1, name: "BIAYA ADMIN", price: adminFee });
    }
    return items;
  }

  const items: { qty: number; name: string; price?: number }[] = [];
  const parts = jenis.split(',').map(p => p.trim());
  
  parts.forEach(part => {
    if (!part) return;
    const match = part.match(/^(\d+)\s*x\s*(.+)$/i) || part.match(/^(.+?)\s*x\s*(\d+)$/i);
    if (match) {
      const isQtyFirst = !isNaN(Number(match[1]));
      const qty = isQtyFirst ? Number(match[1]) : Number(match[2]);
      const name = isQtyFirst ? match[2].trim() : match[1].trim();
      items.push({ qty, name });
    } else {
      items.push({ qty: 1, name: part });
    }
  });

  return items;
};

interface DetailHutangPageProps {
  user: Customer | null;
  transactions: DebtTransaction[];
  salesTransactions: SalesTransaction[];
}

export const DetailHutangPage = ({ user, transactions, salesTransactions }: DetailHutangPageProps) => {
  const { debtId } = useParams<{ debtId: string }>();
  const navigate = useNavigate();

  // Find transaction
  const transaction = transactions.find(
    t => t.id === debtId || t.id_hutang === debtId
  );

  // Matching Sales Transaction for a TAMBAH Debt Transaction
  const matchingSalesTx = useMemo(() => {
    if (!transaction || !salesTransactions || transaction.Tipe !== 'TAMBAH') return null;
    return salesTransactions.find(st => {
      const sameName = st.Nama.toLowerCase() === transaction.Nama.toLowerCase();
      const date1 = st.Tanggal.replace(/[^0-9]/g, '');
      const date2 = transaction.Tanggal.replace(/[^0-9]/g, '');
      const sameDate = date1 === date2 || date1.includes(date2) || date2.includes(date1);
      const sameAmount = Math.abs(st.Pemasukan - transaction.Jumlah) < 10 || Math.abs(st.Sebagian - transaction.Jumlah) < 10;
      return sameName && (sameDate || sameAmount);
    });
  }, [transaction, salesTransactions]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
          Transaksi Kasbon Tidak Ditemukan
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Maaf, data rincian kasbon/hutang dengan ID "{debtId}" tidak dapat ditemukan di sistem kami.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-[#005E6A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#004d58] transition-colors cursor-pointer"
        >
          Kembali Ke Halaman Sebelumnya
        </button>
      </div>
    );
  }

  const isTambah = transaction.Tipe === 'TAMBAH';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e74c3c] to-[#c0392b] flex flex-col items-center py-8 px-4 sm:px-6 print:py-0 print:px-0 print:bg-white">
      {/* Back Button (Hidden in Print) */}
      <div className="w-full max-w-sm mb-6 flex items-center justify-between print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100/10 text-slate-700 hover:text-slate-900 text-xs font-black uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
          Detail Kasbon & Hutang
        </span>
      </div>

      {/* Invoice Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-sm p-6 shadow-xl relative border-x border-slate-100/50 rounded-none print:shadow-none print:p-4"
      >
        {/* Jagged top edge */}
        <div className="absolute top-0 left-0 right-0 h-2 flex overflow-hidden -translate-y-[99%] select-none pointer-events-none print:hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-white rotate-45 shrink-0 translate-y-1.5 shadow-[0_-1px_1px_rgba(0,0,0,0.03)]" />
          ))}
        </div>

        {/* Jagged bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 flex overflow-hidden translate-y-[99%] select-none pointer-events-none print:hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-white rotate-45 shrink-0 -translate-y-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.03)]" />
          ))}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1 mb-6 pt-2 print:mb-4">
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#005E6A] mx-auto mb-3">
            {isTambah ? (
              <PlusCircle className="w-6 h-6 text-red-500" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-green-500" />
            )}
          </div>
          <h2 className="text-sm font-black text-[#005E6A] uppercase tracking-[0.2em]">
            {isTambah ? "CATATAN KASBON" : "BUKTI PEMBAYARAN"}
          </h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Dusun Manis, RT009/RW005<br/>Desa Wilanagara, Kuningan
          </p>
          <div className="h-[1px] w-12 bg-slate-100 mx-auto my-2" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
            ID: {transaction.id_hutang || transaction.id || `HUT-${transaction.Tanggal.replace(/[^0-9]/g, '').slice(0, 12)}`}
          </p>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-y border-slate-100 py-3 mb-4 text-[9px]">
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider">Tanggal</p>
            <p className="font-black text-slate-700 uppercase tracking-tight mt-0.5">{transaction.Tanggal}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider">Pelanggan</p>
            <p className="font-black text-[#005E6A] uppercase tracking-tight mt-0.5">{transaction.Nama || "Pelanggan Umum"}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider">Tipe Transaksi</p>
            <p className="font-black text-[#005E6A] uppercase tracking-tight mt-0.5">{transaction.Tipe}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider">Status</p>
            <p className="font-black text-slate-700 uppercase tracking-tight mt-0.5">
              {transaction.SaldoAkhir === 0 ? "LUNAS" : "BELUM LUNAS"}
            </p>
          </div>
        </div>

        {/* Details Content */}
        <div className="space-y-4 relative">
          {isTambah ? (
            /* KASBON CASE */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hutang Awal</p>
                  <p className="text-xs font-black text-slate-700">Rp {formatCurrency(transaction.SaldoAkhir - transaction.Jumlah)}</p>
                </div>
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/30">
                  <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5">Tambah</p>
                  <p className="text-xs font-black text-red-600">+Rp {formatCurrency(transaction.Jumlah)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-md">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Total Hutang</span>
                <span className="text-sm font-black text-orange-400">Rp {formatCurrency(transaction.SaldoAkhir)}</span>
              </div>

              {/* Action Access to Related Sales Transaction */}
              {matchingSalesTx ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/50">
                    <Receipt className="w-3.5 h-3.5 text-[#005E6A]" />
                    <span>Detail Item Belanja</span>
                  </div>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                    {parseItems(matchingSalesTx.Jenis, matchingSalesTx.Pemasukan, matchingSalesTx.HargaModal, matchingSalesTx.Melalui).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-baseline gap-2 text-[10px]">
                        <span className="font-bold text-slate-700 uppercase truncate max-w-[170px]">{item.name}</span>
                        <div className="flex gap-2 shrink-0">
                          {item.qty > 1 && item.price && (
                            <span className="text-slate-400 font-medium">({item.qty}x Rp {formatCurrency(item.price)})</span>
                          )}
                          <span className="text-slate-900 font-black">
                            Rp {formatCurrency(item.qty * (item.price || matchingSalesTx.Pemasukan / item.qty))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Access Button Requested by User */}
                  <div className="pt-3 border-t border-dashed border-slate-200">
                    <button
                      onClick={() => navigate(`/detail-belanja/${encodeURIComponent(matchingSalesTx.id || matchingSalesTx.id_transaksi || '')}`)}
                      className="w-full py-2 bg-[#005E6A]/5 hover:bg-[#005E6A]/10 text-[#005E6A] rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Lihat Transaksi Belanja</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Fallback Details */
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/50">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Keterangan Tambah</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-700 uppercase leading-relaxed pt-1">
                    {transaction.Keterangan && transaction.Keterangan !== "-" ? transaction.Keterangan : "Penambahan Kasbon Manual"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* BAYAR CASE */
            <div className="space-y-3 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hutang Awal</p>
                  <p className="text-xs font-black text-slate-700">Rp {formatCurrency(transaction.SaldoAkhir + transaction.Jumlah)}</p>
                </div>
                <div className="p-3 bg-green-50/50 rounded-xl border border-green-100/30">
                  <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-0.5">Bayar</p>
                  <p className="text-xs font-black text-green-600">-Rp {formatCurrency(transaction.Jumlah)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-md">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Sisa Hutang</span>
                <span className="text-sm font-black text-emerald-400">Rp {formatCurrency(transaction.SaldoAkhir)}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/50">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Keterangan Bayar</span>
                </div>
                <p className="text-[10px] font-black text-slate-700 uppercase leading-relaxed pt-1">
                  {transaction.Keterangan && transaction.Keterangan !== "-" ? transaction.Keterangan : "Pelunasan Hutang Tunai"}
                </p>
              </div>

              {/* LUNAS ANIMATED STAMP */}
              {transaction.SaldoAkhir === 0 && (
                <motion.div 
                  initial={{ scale: 4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 0.9, rotate: -15 }}
                  transition={{ 
                    type: "spring", 
                    damping: 11, 
                    stiffness: 140, 
                    delay: 0.25 
                  }}
                  className="absolute right-0 top-16 border-4 border-double border-red-500 text-red-500 font-extrabold text-lg px-5 py-1.5 rounded-xl tracking-[0.2em] uppercase select-none pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-white/65 backdrop-blur-[1px] rotate-[-15deg]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  LUNAS
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-2 print:hidden">
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-[#005E6A] hover:bg-[#004D57] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] text-center cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>
      </motion.div>
    </div>
  );
};
