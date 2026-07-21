import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Receipt, 
  Printer, 
  Share2, 
  Check, 
  Package, 
  AlertTriangle 
} from "lucide-react";
import { Customer, SalesTransaction } from "../App";

// Local Helpers copied/referenced from App.tsx/RiwayatPage
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

  if (items.length === 1 && total > 0) {
    items[0].price = total / items[0].qty;
  } else if (items.length > 1 && total > 0) {
    items.forEach(item => {
      item.price = total / items.reduce((acc, curr) => acc + curr.qty, 0);
    });
  }
  
  return items;
};

interface DetailBelanjaPageProps {
  user: Customer | null;
  transactions: SalesTransaction[];
}

export const DetailBelanjaPage = ({ user, transactions }: DetailBelanjaPageProps) => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [shareCopied, setShareCopied] = useState(false);

  // Find transaction
  const transaction = transactions.find(
    t => t.id === transactionId || t.id_transaksi === transactionId
  );

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
          Transaksi Tidak Ditemukan
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          Maaf, data rincian belanja dengan ID "{transactionId}" tidak dapat ditemukan di sistem kami.
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

  const isEdcBni = getIsEdcBni(transaction.Melalui) && transaction.HargaModal > 0;
  const isCashOut = getIsCashOut(transaction.Jenis) && transaction.HargaModal > 0;

  const handleShare = async () => {
    const itemsText = parseItems(transaction.Jenis, transaction.Pemasukan, transaction.HargaModal, transaction.Melalui)
      .map(item => {
        const itemPrice = item.price !== undefined ? item.price : (transaction.Pemasukan / item.qty);
        return `- ${item.qty}x ${item.name} (Rp ${formatCurrency(itemPrice)})`;
      })
      .join('\n');

    let totalLabel = "Grand Total";
    let totalValue = transaction.Pemasukan;

    if (isEdcBni) {
      totalLabel = "Total Diterima";
      totalValue = transaction.HargaModal - 1500;
    } else if (isCashOut) {
      totalLabel = "Total Diterima";
      totalValue = transaction.HargaModal;
    }

    const shareText = `*NOTA TRANSAKSI WARUNG TOMI*
-----------------------------
ID: ${transaction.id_transaksi || transaction.id || `TRX-${transaction.Tanggal.replace(/[^0-9]/g, '').slice(0, 12)}`}
Tanggal: ${transaction.Tanggal}
Pelanggan: ${transaction.Nama || "Pelanggan Umum"}
Metode: ${transaction.Metode || "Tunai"}
Status: ${transaction.Status}
-----------------------------
*Daftar Belanja:*
${itemsText}
-----------------------------
*${totalLabel}: Rp ${formatCurrency(totalValue)}*
Terima kasih telah berbelanja di Warung Tomi!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nota Transaksi Warung Tomi',
          text: shareText,
        });
      } catch (error) {
        try {
          await navigator.clipboard.writeText(shareText);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#005E6A] flex flex-col items-center py-8 px-4 sm:px-6 print:py-0 print:px-0 print:bg-white">
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
          Detail Transaksi Belanja
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
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black text-[#005E6A] uppercase tracking-[0.2em]">WARUNG TOMI</h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Dusun Manis, RT009/RW005<br/>Desa Wilanagara, Kuningan
          </p>
          <div className="h-[1px] w-12 bg-slate-100 mx-auto my-2" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
            ID: {transaction.id_transaksi || transaction.id || `TRX-${transaction.Tanggal.replace(/[^0-9]/g, '').slice(0, 12)}`}
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
            <p className="font-bold text-slate-400 uppercase tracking-wider">Metode</p>
            <p className="font-black text-[#005E6A] uppercase tracking-tight mt-0.5">{transaction.Metode || "Tunai"}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider">Status</p>
            <p className="font-black text-[#005E6A] uppercase tracking-tight mt-0.5">{transaction.Status}</p>
          </div>
        </div>

        {/* Items Listing */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
            <span>Deskripsi Layanan / Produk</span>
            <span>Total</span>
          </div>
          
          <div className="space-y-2.5 max-h-[160px] overflow-y-auto no-scrollbar">
            {parseItems(transaction.Jenis, transaction.Pemasukan, transaction.HargaModal, transaction.Melalui).map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-[#005E6A] uppercase truncate">{item.name}</p>
                  {item.qty > 1 && item.price && (
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {item.qty} x Rp {formatCurrency(item.price)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-black text-slate-700 shrink-0">
                  Rp {formatCurrency(item.qty * (item.price || transaction.Pemasukan / item.qty))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Points Summary */}
        <div className="space-y-2 py-3.5 border-t border-dashed border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {isEdcBni
                ? "Total Diterima"
                : isCashOut
                ? "Total Diterima"
                : "Grand Total"}
            </span>
            <span className="text-base font-black text-[#F15A24]">
              Rp {formatCurrency(
                isEdcBni
                  ? transaction.HargaModal - 1500
                  : isCashOut
                  ? transaction.HargaModal
                  : transaction.Pemasukan
              )}
            </span>
          </div>
          {Math.floor(transaction.Pemasukan / 10000) > 0 && (
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Poin Diperoleh</span>
              <span className="text-[8px] font-black text-white bg-[#F15A24] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                +{Math.floor(transaction.Pemasukan / 10000)} Poin
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Operator</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              {transaction.Melalui || "Sistem"}
            </span>
          </div>
        </div>

        {/* Thank you note */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-[8px] font-black text-[#005E6A] uppercase tracking-[0.2em]">TERIMA KASIH TELAH BERBELANJA</p>
          <div className="flex items-center justify-center gap-1.5 opacity-20">
            <Package className="w-2.5 h-2.5" />
            <span className="text-[7px] font-black uppercase tracking-widest">Belanja Hemat Setiap Hari</span>
            <Package className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Actions (Hidden in print) */}
        <div className="mt-6 flex gap-3 print:hidden">
          {user ? (
            <button 
              onClick={handleShare}
              className="flex-1 py-2.5 bg-[#F15A24] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform active:scale-98 cursor-pointer"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {shareCopied ? "Berhasil Disalin" : "Bagikan"}
            </button>
          ) : (
            <button 
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-[#005E6A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform active:scale-98 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Nota
            </button>
          )}
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </motion.div>
    </div>
  );
};
