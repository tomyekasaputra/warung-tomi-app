import React, { useState, useEffect } from "react";
import { 
  fetchDigiflazzBalance, 
  sendDigiflazzPLNInquiry, 
  sendDigiflazzTransaction,
  fetchDigiflazzPricelist
} from "../lib/digiflazz";
import { 
  Wallet, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Send, 
  Terminal, 
  History, 
  Server, 
  Key, 
  Cpu, 
  Activity,
  CreditCard,
  Building2,
  Receipt,
  Package,
  Layers,
  Check,
  Tag
} from "lucide-react";
import { motion } from "motion/react";

interface TransactionLog {
  id: string;
  timestamp: string;
  type: "INQUIRY_PLN" | "TRANSACTION";
  sku: string;
  customerNo: string;
  status: "Sukses" | "Pending" | "Gagal";
  message: string;
  price?: number;
  refId: string;
}

export const AdminDigiflazzPage: React.FC = () => {
  // Saldo state
  const [balance, setBalance] = useState<number | null>(null);
  const [useProd, setUseProd] = useState<boolean>(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceLastUpdated, setBalanceLastUpdated] = useState<string | null>(null);

  // Inquiry PLN state
  const [inquiryIdpl, setInquiryIdpl] = useState<string>("530000000001");
  const [isInquiring, setIsInquiring] = useState<boolean>(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);

  // Transaction testing state
  const [txSku, setTxSku] = useState<string>("pln20");
  const [txCustomerNo, setTxCustomerNo] = useState<string>("530000000001");
  const [txRefId, setTxRefId] = useState<string>(`ref_${Date.now()}`);
  const [isTxLoading, setIsTxLoading] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<any>(null);

  // Transaction logs
  const [logs, setLogs] = useState<TransactionLog[]>([]);

  // Active tab in Digiflazz page
  const [activeSection, setActiveSection] = useState<"overview" | "catalog" | "inquiry" | "transaction" | "logs">("overview");

  // Catalog Digiflazz State
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [catalogCategory, setCatalogCategory] = useState<string>("Semua");
  const [catalogSourceInfo, setCatalogSourceInfo] = useState<string>("");

  const loadCatalog = async (forceRefresh: boolean = false) => {
    setIsCatalogLoading(true);
    try {
      const res = await fetchDigiflazzPricelist(useProd, forceRefresh);
      if (res && res.data && Array.isArray(res.data)) {
        setCatalogItems(res.data);
        setCatalogSourceInfo(res.source === "live" ? "Ditarik Langsung dari API Digiflazz" : res.source === "cache" ? "Cache Memori Server (Auto-Refresh)" : "Fallback Cache Server");
      }
    } catch (err: any) {
      console.error("Gagal mengambil katalog Digiflazz:", err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "catalog") {
      loadCatalog(false);
    }
  }, [activeSection, useProd]);

  // Load Saldo
  const loadBalance = async (isProd: boolean) => {
    setIsBalanceLoading(true);
    setBalanceError(null);

    try {
      const res = await fetchDigiflazzBalance(isProd);
      if (res && res.data) {
        if (typeof res.data.deposit === "number") {
          setBalance(res.data.deposit);
          setBalanceLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } else if (res.data.message) {
          setBalanceError(res.data.message);
          setBalance(res.data.deposit ?? 0);
        } else {
          setBalance(0);
        }
      } else {
        setBalanceError("Gagal terhubung ke server Digiflazz.");
      }
    } catch (err: any) {
      setBalanceError(err.message || "Gagal mengambil saldo Digiflazz");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    loadBalance(useProd);
  }, [useProd]);

  // Handle PLN Inquiry
  const handleRunInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryIdpl.trim()) return;

    setIsInquiring(true);
    setInquiryResult(null);

    try {
      const res = await sendDigiflazzPLNInquiry(inquiryIdpl.trim(), useProd);
      setInquiryResult(res);

      // Add to logs
      const d = res?.data;
      const statusStr = d?.status === "Sukses" ? "Sukses" : d?.status === "Pending" ? "Pending" : "Gagal";
      
      const newLog: TransactionLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString("id-ID"),
        type: "INQUIRY_PLN",
        sku: "PLN PASCA",
        customerNo: inquiryIdpl,
        status: statusStr,
        message: d?.message || res?.error || "Inquiry Selesai",
        price: d?.price || d?.selling_price,
        refId: d?.ref_id || `INQ-${Date.now()}`
      };

      setLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      setInquiryResult({ error: err.message || "Gagal melakukan inquiry PLN" });
    } finally {
      setIsInquiring(false);
    }
  };

  // Handle Transaction Test
  const handleRunTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txSku.trim() || !txCustomerNo.trim()) return;

    setIsTxLoading(true);
    setTxResult(null);

    const generatedRef = txRefId.trim() || `tx_${Date.now()}`;

    try {
      const res = await sendDigiflazzTransaction({
        skuCode: txSku.trim(),
        customerNo: txCustomerNo.trim(),
        refId: generatedRef,
        useProd: useProd
      });
      setTxResult(res);

      const d = res?.data;
      const statusStr = d?.status === "Sukses" ? "Sukses" : d?.status === "Pending" ? "Pending" : "Gagal";

      const newLog: TransactionLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString("id-ID"),
        type: "TRANSACTION",
        sku: txSku.toUpperCase(),
        customerNo: txCustomerNo,
        status: statusStr,
        message: d?.message || res?.error || "Transaksi Terkirim",
        price: d?.price || d?.selling_price,
        refId: generatedRef
      };

      setLogs((prev) => [newLog, ...prev]);
      setTxRefId(`ref_${Date.now()}`);
    } catch (err: any) {
      setTxResult({ error: err.message || "Gagal mengirim transaksi" });
    } finally {
      setIsTxLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-teal-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Zap className="w-6 h-6" />
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                Pusat Integrasi Digiflazz PPOB
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-300 max-w-2xl">
              Kelola saldo deposit, uji coba API inquiry PLN & pulsa, serta pantau status transaksi PPOB secara real-time via Server Proxy Warung Tomi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Server Proxy Online
            </span>
          </div>
        </div>
      </div>

      {/* Saldo Deposit Widget */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                  Saldo Deposit Real-Time Digiflazz
                </h2>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                  useProd 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" 
                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {useProd ? "PRODUCTION MODE" : "DEVELOPMENT MODE"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Data ditarik langsung via API endpoint `/cek-saldo` Digiflazz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setUseProd(false)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  !useProd 
                    ? "bg-amber-500 text-slate-950 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Dev Key
              </button>
              <button
                onClick={() => setUseProd(true)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  useProd 
                    ? "bg-emerald-500 text-slate-950 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Prod Key
              </button>
            </div>

            <button
              onClick={() => loadBalance(useProd)}
              disabled={isBalanceLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isBalanceLoading ? "animate-spin" : ""}`} />
              <span>Refresh Saldo</span>
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Jumlah Saldo Deposit
            </span>
            <div className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400 flex items-baseline gap-1">
              <span className="text-base text-slate-400">Rp</span>
              {balance !== null 
                ? balance.toLocaleString("id-ID") 
                : isBalanceLoading 
                  ? "..." 
                  : "0"}
            </div>
            {balanceLastUpdated && (
              <span className="text-[10px] font-semibold text-slate-400 mt-2 block">
                Pembaruan Terakhir: {balanceLastUpdated}
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Konfigurasi API Credential
            </span>
            <div className="text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Username:</span>
                <span className="font-bold">hohebuo6jzVo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Dev API Key:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">dev-692c...6546</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Prod API Key:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">1c51...5ee7</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Status Enkripsi & Server
            </span>
            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>MD5 Sign Auto-Hash (Server Node)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                API Key dan Sign MD5 diproses di backend Express server agar aman dari pembacaan browser.
              </p>
            </div>
          </div>
        </div>

        {balanceError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Pesan API Digiflazz: {balanceError}</span>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection("overview")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "overview"
              ? "bg-[#005E6A] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Inquiry PLN Pasca</span>
        </button>

        <button
          onClick={() => setActiveSection("catalog")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "catalog"
              ? "bg-[#005E6A] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <Package className="w-4 h-4 text-amber-400" />
          <span>Katalog Produk Digiflazz ({catalogItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSection("transaction")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "transaction"
              ? "bg-[#005E6A] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Uji Transaksi PPOB</span>
        </button>

        <button
          onClick={() => setActiveSection("logs")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === "logs"
              ? "bg-[#005E6A] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Aktivitas ({logs.length})</span>
        </button>
      </div>

      {/* SECTION CATALOG DIGIFLAZZ */}
      {activeSection === "catalog" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Daftar Produk PPOB Digiflazz (Pulsa, Data, Token PLN, DLL)
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {catalogSourceInfo || "Pricelist Digiflazz PPOB terhubung ke server proxy."}
              </p>
            </div>

            <button
              onClick={() => loadCatalog(true)}
              disabled={isCatalogLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isCatalogLoading ? "animate-spin" : ""}`} />
              <span>Sync Pricelist Terbaru</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cari nama produk, SKU, brand (misal: Telkomsel, PLN, ax10)..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Pulsa">Pulsa</option>
              <option value="Data">Paket Data</option>
              <option value="PLN">Token PLN / PLN</option>
              <option value="Voucher">Voucher</option>
            </select>
          </div>

          {/* Catalog Table */}
          {isCatalogLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Memuat Produk Digiflazz...</p>
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Package className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold uppercase">Belum ada produk Digiflazz yang dimuat.</p>
              <button
                onClick={() => loadCatalog(true)}
                className="text-xs font-black text-teal-600 dark:text-teal-400 underline cursor-pointer"
              >
                Klik di sini untuk mengambil pricelist
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3">SKU Code</th>
                    <th className="py-3 px-3">Nama Produk</th>
                    <th className="py-3 px-3">Kategori / Brand</th>
                    <th className="py-3 px-3 text-right">Harga Modal Digiflazz</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {catalogItems
                    .filter((item) => {
                      if (catalogCategory !== "Semua") {
                        const itemCat = String(item.category || item.brand || "").toLowerCase();
                        if (!itemCat.includes(catalogCategory.toLowerCase())) return false;
                      }
                      if (catalogSearch.trim()) {
                        const q = catalogSearch.toLowerCase();
                        const name = String(item.product_name || "").toLowerCase();
                        const sku = String(item.buyer_sku_code || "").toLowerCase();
                        const brand = String(item.brand || "").toLowerCase();
                        return name.includes(q) || sku.includes(q) || brand.includes(q);
                      }
                      return true;
                    })
                    .slice(0, 100)
                    .map((item, idx) => {
                      const isAvailable = item.buyer_product_status && item.seller_product_status;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{item.buyer_sku_code}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                            {item.product_name}
                            {item.desc && <span className="block text-[10px] font-normal text-slate-400">{item.desc}</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              {item.category || "General"} • {item.brand}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            Rp {(item.price || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isAvailable ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}>
                              {isAvailable ? "AKTIF" : "GANGGUAN"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setTxSku(item.buyer_sku_code);
                                setActiveSection("transaction");
                              }}
                              className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white rounded-lg transition-all cursor-pointer"
                            >
                              Uji SKU
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: INQUIRY PLN PASCA */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Receipt className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                Inquiry Real-time Tagihan Listrik PLN Pasca
              </h3>
            </div>

            <form onSubmit={handleRunInquiry} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Nomor ID Pelanggan PLN / No. Meter
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inquiryIdpl}
                    onChange={(e) => setInquiryIdpl(e.target.value)}
                    placeholder="Contoh: 530000000001"
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isInquiring}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Search className={`w-4 h-4 ${isInquiring ? "animate-spin" : ""}`} />
                    <span>Inquiry PLN</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Contoh Nomor Pengujian (Dev Key)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInquiryIdpl("530000000001")}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold text-[10px] hover:border-amber-500 cursor-pointer"
                  >
                    530000000001 (Tagihan Lunas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryIdpl("530000000002")}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold text-[10px] hover:border-amber-500 cursor-pointer"
                  >
                    530000000002 (Belum Lunas)
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Inquiry Output */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-teal-500" />
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                  Respon API Digiflazz
                </h3>
              </div>
              {inquiryResult && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                  HTTP 200 OK
                </span>
              )}
            </div>

            {isInquiring ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Mengirim permintaan inquiry ke server Digiflazz...</p>
              </div>
            ) : inquiryResult ? (
              <div className="space-y-3">
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto border border-slate-800 max-h-80 leading-relaxed">
                  {JSON.stringify(inquiryResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">
                  Masukkan IDPL dan klik button Inquiry PLN untuk melihat respon mentah Digiflazz API.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: UJI TRANSAKSI PPOB */}
      {activeSection === "transaction" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-teal-500" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                Pengujian / Topup Transaksi PPOB
              </h3>
            </div>

            <form onSubmit={handleRunTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  SKU Produk Digiflazz (Buyer SKU Code)
                </label>
                <input
                  type="text"
                  value={txSku}
                  onChange={(e) => setTxSku(e.target.value)}
                  placeholder="Contoh: pln20, xld10, tsel5"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Nomor Tujuan / IDPL / No. HP
                </label>
                <input
                  type="text"
                  value={txCustomerNo}
                  onChange={(e) => setTxCustomerNo(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 530000000001"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Reference ID Unik (Ref ID)
                </label>
                <input
                  type="text"
                  value={txRefId}
                  onChange={(e) => setTxRefId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isTxLoading}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isTxLoading ? "animate-spin" : ""}`} />
                  <span>Kirim Transaksi Ke Digiflazz</span>
                </button>
              </div>
            </form>
          </div>

          {/* Transaction Output Log */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                  Output Hasil Transaksi
                </h3>
              </div>
            </div>

            {isTxLoading ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Memproses transaksi via server proxy Digiflazz...</p>
              </div>
            ) : txResult ? (
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto border border-slate-800 max-h-80 leading-relaxed">
                {JSON.stringify(txResult, null, 2)}
              </pre>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <Send className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">
                  Isi SKU dan Nomor Tujuan lalu klik Kirim Transaksi.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: LOG AKTIMITAS */}
      {activeSection === "logs" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                Riwayat Log Aktivitas Digiflazz Session Ini
              </h3>
            </div>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Bersihkan Log
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-slate-400">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">Belum ada aktivitas inquiry atau transaksi pada sesi ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">SKU / Layanan</th>
                    <th className="py-2.5 px-3">No. Tujuan / IDPL</th>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Pesan Respon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{log.sku}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{log.customerNo}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{log.refId}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          log.status === "Sukses"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : log.status === "Pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
