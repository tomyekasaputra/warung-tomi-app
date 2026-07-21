import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  PiggyBank, 
  Calendar, 
  Star, 
  Trophy, 
  AlertTriangle 
} from "lucide-react";
import { Customer, SavingTransaction } from "../App";

const formatCurrency = (val: number | string | undefined) => {
  if (val === undefined || val === null) return "0";
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, '')) || 0;
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getMotivationMessage = (nominal: number) => {
  if (nominal >= 100000) {
    return "Luar biasa! Tabungan besar hari ini akan menjadi pondasi kesuksesan finansialmu di masa depan! 🚀✨";
  } else if (nominal >= 50000) {
    return "Mantap sekali! Semakin rajin menabung, impianmu akan semakin cepat terwujud! Semangat terus ya! 💪🌟";
  } else {
    return "Hebat! Sedikit demi sedikit, lama-lama menjadi bukit. Setiap rupiah yang kamu tabung sangat berarti! 🏆💖";
  }
};

interface DetailTabunganPageProps {
  user: Customer | null;
  transactions: SavingTransaction[];
}

export const DetailTabunganPage = ({ user, transactions }: DetailTabunganPageProps) => {
  const { savingId } = useParams<{ savingId: string }>();
  const navigate = useNavigate();

  // Find transaction
  const transaction = transactions.find(
    t => t.id === savingId || t.id_tabungan === savingId
  );

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
          Transaksi Tabungan Tidak Ditemukan
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Maaf, data rincian tabungan dengan ID "{savingId}" tidak dapat ditemukan di sistem kami.
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

  const isDeposit = transaction.Tipe === 'SETOR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2ecc71] to-[#27ae60] flex flex-col items-center py-8 px-4 sm:px-6 print:py-0 print:px-0 print:bg-white">
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
          Detail Tabungan
        </span>
      </div>

      {/* Detail Saving Transaction Card */}
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
            <PiggyBank className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black text-[#005E6A] uppercase tracking-[0.2em]">TABUNGAN WARUNG TOMI</h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Dusun Manis, RT009/RW005<br/>Desa Wilanagara, Kuningan
          </p>
          <div className="h-[1px] w-12 bg-slate-100 mx-auto my-2" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
            ID: {transaction.id_tabungan || transaction.id || `TAB-${transaction.Tanggal.replace(/[^0-9]/g, '').slice(0, 12)}`}
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
          {transaction.Berita && (
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider">Catatan</p>
              <p className="font-black text-slate-700 uppercase tracking-tight mt-0.5">{transaction.Berita}</p>
            </div>
          )}
        </div>

        {/* Details Content */}
        <div className="space-y-4 relative">
          {isDeposit ? (
            /* DEPOSIT CASE */
            <div className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saldo Awal</p>
                  <p className="text-xs font-black text-slate-700">Rp {formatCurrency(transaction.SaldoAkhir - transaction.Nominal)}</p>
                </div>
                <div className="p-3 bg-green-50/50 rounded-xl border border-green-100/30">
                  <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-0.5">Tambah Setor</p>
                  <p className="text-xs font-black text-green-600">+Rp {formatCurrency(transaction.Nominal)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-md">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Saldo Akhir</span>
                <span className="text-sm font-black text-emerald-400">Rp {formatCurrency(transaction.SaldoAkhir)}</span>
              </div>

              {/* Encouraging Section with Animation */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-xl border border-emerald-100/50 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
                {/* Floating Animated Stars */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400 pointer-events-none"
                    initial={{ opacity: 0, scale: 0, y: 15, x: i === 0 ? -40 : i === 1 ? 40 : 0 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.3, 1, 0.5], 
                      y: [-10, -35, -55],
                      x: i === 0 ? [-40, -50, -55] : i === 1 ? [40, 50, 55] : [0, -10, 15]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      delay: i * 0.7,
                      ease: "easeOut"
                    }}
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  </motion.div>
                ))}

                <motion.div
                  animate={{ rotate: [0, 8, -8, 8, 0], scale: [1, 1.1, 1.1, 1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 0.8 }}
                  className="text-emerald-500 bg-white p-2.5 rounded-full shadow-sm relative z-10"
                >
                  <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
                </motion.div>
                <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider relative z-10">Luar Biasa!</p>
                <p className="text-[10px] font-bold text-emerald-700 leading-relaxed max-w-[240px] relative z-10">
                  {getMotivationMessage(transaction.Nominal)}
                </p>
              </div>
            </div>
          ) : (
            /* WITHDRAWAL CASE */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saldo Awal</p>
                  <p className="text-xs font-black text-slate-700">Rp {formatCurrency(transaction.SaldoAkhir + transaction.Nominal)}</p>
                </div>
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/30">
                  <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-0.5">Ditarik</p>
                  <p className="text-xs font-black text-red-600">-Rp {formatCurrency(transaction.Nominal)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-md">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Sisa Saldo</span>
                <span className="text-sm font-black text-orange-400">Rp {formatCurrency(transaction.SaldoAkhir)}</span>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/50 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
                <div className="text-amber-500 bg-white p-2.5 rounded-full shadow-sm">
                  <PiggyBank className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Catatan Tabungan</p>
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed max-w-[240px]">
                  Penarikan tabungan berhasil dicatat. Yuk, sisihkan lagi sebagian rezeki mu untuk ditabung nanti! 😉
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
