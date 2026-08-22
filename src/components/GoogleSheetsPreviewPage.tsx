import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, 
  ExternalLink, Search, Filter, Eye, ChevronDown, ChevronUp, 
  Sparkles, Check, Download, Copy, Info, AlertCircle, HelpCircle,
  Database, User, Wallet, ShieldAlert, Award, Star, TrendingUp, Layers,
  Layers2, Clock, Zap, FileText, CheckCircle
} from "lucide-react";
import { 
  computeCustomerStatsForSheets, 
  syncCustomersToGoogleSheets, 
  checkGoogleSheetsAuthStatus,
  GoogleSheetsAuthStatus,
  DEFAULT_APPS_SCRIPT_URL
} from "../lib/googleSheetsSync";
import { getCachedAccessToken } from "../lib/firebaseAuth";
import { SupabaseSavingsService, SupabaseDebtService, SupabaseCustomerService } from "../lib/supabase";

interface GoogleSheetsPreviewPageProps {
  customers: any[];
  salesTransactions?: any[];
  savingsTransactions?: any[];
  investmentTransactions?: any[];
  debtTransactions?: any[];
  redeemedPoints?: any[];
  onSyncComplete?: () => void;
}

export interface SyncedCustomerRow {
  id_pelanggan: string;
  nama: string;
  tabungan: number;
  investasi: number;
  lainnya: number;
  hutang: number;
  level: string;
  poin: number;
  total_belanja_bulan_ini: number;
  peringkat: string;
  aktivitas_terakhir: string;
  mutasi_tabungan: string;
  catatan_hutang: string;
  terakhir_diperbarui: string;
  pin?: string;
  telepon?: string;
  alamat?: string;
  [key: string]: any;
}

export default function GoogleSheetsPreviewPage({
  customers,
  salesTransactions = [],
  savingsTransactions = [],
  investmentTransactions = [],
  debtTransactions = [],
  redeemedPoints = [],
  onSyncComplete
}: GoogleSheetsPreviewPageProps) {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "updated" | "unchanged" | "with_debt" | "with_savings">("all");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "analysis" | "raw_json">("table");

  // Full historical data states (semua bulan / all-time)
  const [fullSavings, setFullSavings] = useState<any[]>(savingsTransactions);
  const [fullDebts, setFullDebts] = useState<any[]>(debtTransactions);
  const [isFetchingFullHistory, setIsFetchingFullHistory] = useState<boolean>(false);

  useEffect(() => {
    setFullSavings(savingsTransactions);
  }, [savingsTransactions]);

  useEffect(() => {
    setFullDebts(debtTransactions);
  }, [debtTransactions]);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [authStatus, setAuthStatus] = useState<GoogleSheetsAuthStatus>({ authenticated: false });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem("LAST_SHEETS_SYNC") || "Belum Pernah";
  });

  // Snapshot map from localStorage to detect changed vs unchanged data
  const [snapshotMap, setSnapshotMap] = useState<Record<string, any>>(() => {
    try {
      const raw = localStorage.getItem("SHEETS_LAST_SYNCED_SNAPSHOT");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load sheets snapshot:", e);
    }
    return {};
  });

  // Load Auth Status & Full Historical Transactions across all months
  useEffect(() => {
    checkGoogleSheetsAuthStatus().then(status => {
      setAuthStatus(status);
    });

    let isMounted = true;
    const fetchAllHistory = async () => {
      if (SupabaseSavingsService.isConnected() || SupabaseDebtService.isConnected()) {
        try {
          setIsFetchingFullHistory(true);
          const promises: Promise<any>[] = [];

          if (SupabaseSavingsService.isConnected()) {
            promises.push(SupabaseSavingsService.getSavings({ limit: 50000 }));
          } else {
            promises.push(Promise.resolve({ data: null }));
          }

          if (SupabaseDebtService.isConnected()) {
            promises.push(SupabaseDebtService.getDebts({ allHistory: true, limit: 50000 }));
          } else {
            promises.push(Promise.resolve({ data: null }));
          }

          const [savingsRes, debtsRes] = await Promise.all(promises);
          if (!isMounted) return;

          if (savingsRes?.data && savingsRes.data.length > 0) {
            const mapped = savingsRes.data.map((item: any) => ({
              id: item.id_tabungan || item.id,
              id_tabungan: item.id_tabungan,
              id_pelanggan: item.id_pelanggan || 'CUST-0000',
              Tanggal: item.tanggal || '',
              tanggal: item.tanggal || '',
              Nama: item.nama || 'Nasabah',
              nama: item.nama || 'Nasabah',
              Tipe: String(item.tipe || 'SETOR').toUpperCase(),
              tipe: String(item.tipe || 'SETOR').toUpperCase(),
              Nominal: Number(item.nominal) || 0,
              nominal: Number(item.nominal) || 0,
              SaldoAkhir: Number(item.saldo_akhir) || 0,
              saldo_akhir: Number(item.saldo_akhir) || 0,
              Berita: item.berita || '-'
            }));
            setFullSavings(mapped);
          }

          if (debtsRes?.data && debtsRes.data.length > 0) {
            const mapped = debtsRes.data.map((item: any) => ({
              id: item.id_hutang || item.id,
              id_hutang: item.id_hutang,
              id_pelanggan: item.id_pelanggan || 'CUST-0000',
              Tanggal: item.tanggal || '',
              tanggal: item.tanggal || '',
              Nama: item.nama || 'Pelanggan',
              nama: item.nama || 'Pelanggan',
              Tipe: String(item.tipe || 'HUTANG').toUpperCase(),
              tipe: String(item.tipe || 'HUTANG').toUpperCase(),
              Jumlah: Number(item.jumlah) || 0,
              jumlah: Number(item.jumlah) || 0,
              SaldoAkhir: Number(item.saldo_akhir) || 0,
              saldo_akhir: Number(item.saldo_akhir) || 0,
              Keterangan: item.keterangan || '-'
            }));
            setFullDebts(mapped);
          }
        } catch (err) {
          console.warn("Could not load full history in GoogleSheetsPreviewPage:", err);
        } finally {
          if (isMounted) setIsFetchingFullHistory(false);
        }
      }
    };

    fetchAllHistory();
    return () => { isMounted = false; };
  }, []);

  // Compute Full Data that is ready to be sent to Google Sheets (using all historical transactions)
  const computedData: SyncedCustomerRow[] = useMemo(() => {
    const rawList = computeCustomerStatsForSheets(
      customers,
      salesTransactions,
      fullSavings.length > 0 ? fullSavings : savingsTransactions,
      fullDebts.length > 0 ? fullDebts : debtTransactions,
      investmentTransactions,
      redeemedPoints
    );
    return rawList as SyncedCustomerRow[];
  }, [customers, salesTransactions, fullSavings, fullDebts, savingsTransactions, debtTransactions, investmentTransactions, redeemedPoints]);

  // Analyze each row to determine if it has changed (GREEN) or unchanged (NORMAL)
  const rowsWithDiff = useMemo(() => {
    const hasSnapshot = Object.keys(snapshotMap).length > 0;

    return computedData.map((row, idx) => {
      const key = (row.id_pelanggan || row.nama || `cust_${idx}`).toLowerCase().trim();
      const prev = snapshotMap[key];

      const changedFields: { field: string; prevVal: any; newVal: any }[] = [];

      if (!prev) {
        // If snapshot exists but this customer is not in it, it's newly added
        if (hasSnapshot) {
          changedFields.push({ field: "Pelanggan Baru", prevVal: "-", newVal: row.nama });
        }
      } else {
        if (String(prev.nama || "").trim() !== String(row.nama || "").trim()) {
          changedFields.push({ field: "Nama", prevVal: prev.nama, newVal: row.nama });
        }
        if (Number(prev.tabungan || 0) !== Number(row.tabungan || 0)) {
          changedFields.push({ field: "Tabungan", prevVal: prev.tabungan, newVal: row.tabungan });
        }
        if (Number(prev.investasi || 0) !== Number(row.investasi || 0)) {
          changedFields.push({ field: "Investasi", prevVal: prev.investasi, newVal: row.investasi });
        }
        if (Number(prev.lainnya || 0) !== Number(row.lainnya || 0)) {
          changedFields.push({ field: "Lainnya", prevVal: prev.lainnya, newVal: row.lainnya });
        }
        if (Number(prev.hutang || 0) !== Number(row.hutang || 0)) {
          changedFields.push({ field: "Hutang", prevVal: prev.hutang, newVal: row.hutang });
        }
        if (String(prev.level || "Bronze") !== String(row.level || "Bronze")) {
          changedFields.push({ field: "Level", prevVal: prev.level, newVal: row.level });
        }
        if (Number(prev.poin || 0) !== Number(row.poin || 0)) {
          changedFields.push({ field: "Poin", prevVal: prev.poin, newVal: row.poin });
        }
        if (Number(prev.total_belanja_bulan_ini || 0) !== Number(row.total_belanja_bulan_ini || 0)) {
          changedFields.push({ field: "Belanja Bulan Ini", prevVal: prev.total_belanja_bulan_ini, newVal: row.total_belanja_bulan_ini });
        }
        if (String(prev.peringkat || "") !== String(row.peringkat || "")) {
          changedFields.push({ field: "Peringkat", prevVal: prev.peringkat, newVal: row.peringkat });
        }
        if (String(prev.aktivitas_terakhir || "").trim() !== String(row.aktivitas_terakhir || "").trim()) {
          changedFields.push({ field: "Aktivitas Terakhir", prevVal: prev.aktivitas_terakhir, newVal: row.aktivitas_terakhir });
        }
        if (String(prev.mutasi_tabungan || "").trim() !== String(row.mutasi_tabungan || "").trim()) {
          changedFields.push({ field: "Mutasi Tabungan", prevVal: prev.mutasi_tabungan, newVal: row.mutasi_tabungan });
        }
        if (String(prev.catatan_hutang || "").trim() !== String(row.catatan_hutang || "").trim()) {
          changedFields.push({ field: "Catatan Hutang", prevVal: prev.catatan_hutang, newVal: row.catatan_hutang });
        }
      }

      const isUpdated = !hasSnapshot || changedFields.length > 0;

      return {
        ...row,
        _key: key,
        _isUpdated: isUpdated,
        _changedFields: changedFields,
        _isNew: !prev && hasSnapshot
      };
    });
  }, [computedData, snapshotMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rowsWithDiff.length;
    const updatedCount = rowsWithDiff.filter(r => r._isUpdated).length;
    const unchangedCount = total - updatedCount;
    const totalTabungan = rowsWithDiff.reduce((acc, curr) => acc + (curr.tabungan || 0), 0);
    const totalHutang = rowsWithDiff.reduce((acc, curr) => acc + (curr.hutang || 0), 0);
    const totalInvestasi = rowsWithDiff.reduce((acc, curr) => acc + (curr.investasi || 0), 0);
    const totalLainnya = rowsWithDiff.reduce((acc, curr) => acc + (curr.lainnya || 0), 0);
    const totalPoin = rowsWithDiff.reduce((acc, curr) => acc + (curr.poin || 0), 0);
    const totalBelanja = rowsWithDiff.reduce((acc, curr) => acc + (curr.total_belanja_bulan_ini || 0), 0);

    // Completeness Checks
    const missingIdCount = rowsWithDiff.filter(r => !r.id_pelanggan || r.id_pelanggan === "CUST-0000" || r.id_pelanggan === "CUST-XXXX").length;
    const withDebtCount = rowsWithDiff.filter(r => (r.hutang || 0) > 0).length;
    const withSavingsCount = rowsWithDiff.filter(r => (r.tabungan || 0) > 0).length;
    const activeShoppersCount = rowsWithDiff.filter(r => (r.total_belanja_bulan_ini || 0) > 0).length;

    return {
      total,
      updatedCount,
      unchangedCount,
      totalTabungan,
      totalHutang,
      totalInvestasi,
      totalLainnya,
      totalPoin,
      totalBelanja,
      missingIdCount,
      withDebtCount,
      withSavingsCount,
      activeShoppersCount
    };
  }, [rowsWithDiff]);

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    let list = rowsWithDiff;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(r => 
        (r.nama || "").toLowerCase().includes(q) ||
        (r.id_pelanggan || "").toLowerCase().includes(q) ||
        (r.level || "").toLowerCase().includes(q) ||
        (r.aktivitas_terakhir || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterMode === "updated") {
      list = list.filter(r => r._isUpdated);
    } else if (filterMode === "unchanged") {
      list = list.filter(r => !r._isUpdated);
    } else if (filterMode === "with_debt") {
      list = list.filter(r => (r.hutang || 0) > 0);
    } else if (filterMode === "with_savings") {
      list = list.filter(r => (r.tabungan || 0) > 0);
    }

    // Level filter
    if (levelFilter !== "ALL") {
      list = list.filter(r => (r.level || "Bronze").toUpperCase() === levelFilter.toUpperCase());
    }

    return list;
  }, [rowsWithDiff, searchTerm, filterMode, levelFilter]);

  // Save latest snapshot when sync succeeds
  const updateLocalSnapshot = (dataToSave: SyncedCustomerRow[]) => {
    const newSnapshot: Record<string, any> = {};
    dataToSave.forEach((item, idx) => {
      const key = (item.id_pelanggan || item.nama || `cust_${idx}`).toLowerCase().trim();
      newSnapshot[key] = {
        id_pelanggan: item.id_pelanggan || "",
        nama: item.nama || "",
        tabungan: item.tabungan || 0,
        investasi: item.investasi || 0,
        lainnya: item.lainnya || 0,
        hutang: item.hutang || 0,
        level: item.level || "Bronze",
        poin: item.poin || 0,
        total_belanja_bulan_ini: item.total_belanja_bulan_ini || 0,
        peringkat: item.peringkat || "",
        aktivitas_terakhir: item.aktivitas_terakhir || "",
        mutasi_tabungan: item.mutasi_tabungan || "",
        catatan_hutang: item.catatan_hutang || ""
      };
    });

    const timeStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    try {
      localStorage.setItem("SHEETS_LAST_SYNCED_SNAPSHOT", JSON.stringify(newSnapshot));
      localStorage.setItem("LAST_SHEETS_SYNC", timeStr);
    } catch (e) {
      console.error("Error saving snapshot to localStorage:", e);
    }

    setSnapshotMap(newSnapshot);
    setLastSyncTime(timeStr);
  };

  // Handle Sync Now to Google Sheets
  const handlePerformSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: "info", text: "Sedang mengirim seluruh data pelanggan ke Google Sheets..." });

    try {
      // 1. Try Direct Apps Script Webhook first (no oauth expired risk)
      let syncedSuccessfully = false;
      let resultSpreadsheetUrl = authStatus.spreadsheetUrl;

      try {
        const payloadData = computedData;
        const res = await fetch("/api/sheets/apps-script-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scriptUrl: DEFAULT_APPS_SCRIPT_URL,
            customers: payloadData
          })
        });

        const resJson = await res.json();
        if (resJson.success) {
          syncedSuccessfully = true;
          if (resJson.spreadsheetUrl) resultSpreadsheetUrl = resJson.spreadsheetUrl;
        }
      } catch (scriptErr) {
        console.warn("Apps script direct sync attempt failed, trying OAuth endpoint...", scriptErr);
      }

      // 2. If direct sync didn't complete, fallback to server Google Sheets API
      if (!syncedSuccessfully) {
        const token = getCachedAccessToken();
        const oauthRes = await syncCustomersToGoogleSheets(computedData, "Data Pelanggan - Warung Tomi", token);
        if (oauthRes.success) {
          syncedSuccessfully = true;
          if (oauthRes.spreadsheetUrl) resultSpreadsheetUrl = oauthRes.spreadsheetUrl;
        } else {
          throw new Error(oauthRes.message || oauthRes.error || "Gagal menyinkronkan data ke Google Sheets");
        }
      }

      if (syncedSuccessfully) {
        updateLocalSnapshot(computedData);
        setSyncStatus({
          type: "success",
          text: `✓ Berhasil! Seluruh ${computedData.length} data pelanggan telah tersingkron ke Google Sheets.`
        });
        if (onSyncComplete) onSyncComplete();
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        text: err.message || "Gagal menyinkronkan data ke Google Sheets."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Mark all current data as synchronized (reset diff snapshot)
  const handleMarkAllAsSynced = () => {
    updateLocalSnapshot(computedData);
    setSyncStatus({
      type: "success",
      text: "Snapshot berhasil diperbarui. Seluruh data sekarang bertanda sinkron (Netral)."
    });
    setTimeout(() => setSyncStatus(null), 4000);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Pelanggan",
      "Nama",
      "Tabungan",
      "Investasi",
      "Lainnya",
      "Hutang",
      "Level",
      "Poin",
      "Total Belanja Bulan Ini",
      "Peringkat",
      "Aktivitas Terakhir",
      "Mutasi Tabungan",
      "Catatan Hutang",
      "Terakhir Diperbarui"
    ];

    const rows = computedData.map(c => [
      `"${c.id_pelanggan || ""}"`,
      `"${(c.nama || "").replace(/"/g, '""')}"`,
      c.tabungan || 0,
      c.investasi || 0,
      c.lainnya || 0,
      c.hutang || 0,
      `"${c.level || "Bronze"}"`,
      c.poin || 0,
      c.total_belanja_bulan_ini || 0,
      `"${c.peringkat || ""}"`,
      `"${(c.aktivitas_terakhir || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(c.mutasi_tabungan || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(c.catatan_hutang || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${c.terakhir_diperbarui || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pelanggan_Google_Sheets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 text-slate-800 dark:text-slate-100">
      {/* Header Sticky Banner */}
      <div className="bg-gradient-to-r from-[#005E6A] via-[#004e58] to-[#003c44] text-white px-4 sm:px-8 pt-8 pb-14 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-5">
          {/* Top Row: Back button & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate("/admin/customers")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pelanggan</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white/10 border border-white/20 text-white flex items-center gap-1.5 backdrop-blur-xs">
                <Clock className="w-3 h-3 text-teal-300" />
                Terakhir Sync: <strong className="text-teal-200">{lastSyncTime}</strong>
              </span>

              {authStatus.spreadsheetUrl && (
                <a
                  href={authStatus.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Main Title & Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                    Preview Data Google Sheets
                  </h1>
                  <p className="text-xs text-teal-100 font-medium">
                    Lihat seluruh 14 kolom data yang akan dikirim ke Google Spreadsheet secara lengkap.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleMarkAllAsSynced}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
                title="Tandai data sekarang sebagai patokan baseline sinkron"
              >
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Tandai Semua Sinkron</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-200" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePerformSync}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Sedang Menyinkronkan..." : "Singkronkan ke Google Sheets"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-7 space-y-6 relative z-20">
        {/* Status Toast Banner */}
        <AnimatePresence>
          {syncStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg border ${
                syncStatus.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800"
                  : syncStatus.type === "error"
                  ? "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800"
                  : "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {syncStatus.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {syncStatus.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                {syncStatus.type === "info" && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
                <span>{syncStatus.text}</span>
              </div>
              <button
                onClick={() => setSyncStatus(null)}
                className="text-xs font-black opacity-70 hover:opacity-100 uppercase"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend / Color Code Indicator Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-[#005E6A] dark:text-teal-300 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Keterangan Warna Status Data Sinkronisasi
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Membedakan data yang mengalami pembaruan sejak sinkronisasi terakhir:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Green Badge Indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Baris Hijau = <strong>Ada Pembaruan / Baru ({metrics.updatedCount})</strong></span>
            </div>

            {/* Neutral Badge Indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
              <span>Baris Standar = <strong>Sudah Sinkron ({metrics.unchangedCount})</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Data Pelanggan</p>
            <p className="text-xl sm:text-2xl font-black text-[#005E6A] dark:text-teal-400">{metrics.total} Pelanggan</p>
            <p className="text-[10px] text-slate-500">14 Kolom data per pelanggan</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Data Ada Update (Hijau)</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">{metrics.updatedCount} Pelanggan</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Siap dikirim ke Google Sheets</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Sudah Sinkron (Netral)</p>
            <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.unchangedCount} Pelanggan</p>
            <p className="text-[10px] text-slate-500">Sama persis dengan spreadsheet</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hutang & Tabungan</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-rose-600">H: Rp {metrics.totalHutang.toLocaleString("id-ID")}</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-teal-600">T: Rp {metrics.totalTabungan.toLocaleString("id-ID")}</span>
            </div>
            <p className="text-[10px] text-slate-500">Poin: {metrics.totalPoin.toLocaleString("id-ID")}</p>
          </div>
        </div>

        {/* Tab Selection: Tabel Lengkap vs Analisis Data Kurang */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "table"
                  ? "bg-[#005E6A] text-white shadow-md shadow-teal-900/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tabel Spreadsheet Lengkap ({filteredRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "analysis"
                  ? "bg-[#005E6A] text-white shadow-md shadow-teal-900/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Cek Kelengkapan Data</span>
            </button>
          </div>

          <p className="hidden md:block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menampilkan {filteredRows.length} dari {computedData.length} baris
          </p>
        </div>

        {/* TAB 1: TABEL SPREADSHEET LENGKAP */}
        {activeTab === "table" && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama pelanggan, ID pelanggan, aktivitas..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterMode === "all"
                        ? "bg-[#005E6A] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Semua ({rowsWithDiff.length})
                  </button>

                  <button
                    onClick={() => setFilterMode("updated")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterMode === "updated"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Ada Update ({metrics.updatedCount})</span>
                  </button>

                  <button
                    onClick={() => setFilterMode("unchanged")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterMode === "unchanged"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Sudah Sinkron ({metrics.unchangedCount})
                  </button>

                  <button
                    onClick={() => setFilterMode("with_debt")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterMode === "with_debt"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100"
                    }`}
                  >
                    Ada Hutang ({metrics.withDebtCount})
                  </button>

                  <button
                    onClick={() => setFilterMode("with_savings")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterMode === "with_savings"
                        ? "bg-teal-600 text-white"
                        : "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 hover:bg-teal-100"
                    }`}
                  >
                    Ada Tabungan ({metrics.withSavingsCount})
                  </button>
                </div>
              </div>
            </div>

            {/* The Main Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none">
                      <th className="p-3.5 text-center w-12">No</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">ID Pelanggan</th>
                      <th className="p-3.5">Nama Pelanggan</th>
                      <th className="p-3.5 text-right">Tabungan</th>
                      <th className="p-3.5 text-right">Investasi</th>
                      <th className="p-3.5 text-right">Lainnya</th>
                      <th className="p-3.5 text-right">Hutang</th>
                      <th className="p-3.5 text-center">Level</th>
                      <th className="p-3.5 text-center">Poin</th>
                      <th className="p-3.5 text-right">Belanja Bln Ini</th>
                      <th className="p-3.5">Peringkat</th>
                      <th className="p-3.5 w-64">Aktivitas Terakhir</th>
                      <th className="p-3.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, idx) => {
                        const isExpanded = expandedRowId === row._key;
                        const isUpdated = row._isUpdated;

                        return (
                          <React.Fragment key={row._key || idx}>
                            <tr
                              className={`transition-colors ${
                                isUpdated
                                  ? "bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border-l-4 border-l-emerald-500"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent"
                              }`}
                            >
                              {/* No */}
                              <td className="p-3.5 text-center text-slate-400 text-[11px] font-bold">
                                {idx + 1}
                              </td>

                              {/* Status Sync Badge */}
                              <td className="p-3.5">
                                {isUpdated ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Update</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Sinkron</span>
                                  </span>
                                )}
                              </td>

                              {/* ID Pelanggan */}
                              <td className="p-3.5 font-bold font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {row.id_pelanggan ? (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                    {row.id_pelanggan}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-bold text-[10px] bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                                    Belum Ada ID
                                  </span>
                                )}
                              </td>

                              {/* Nama Pelanggan */}
                              <td className="p-3.5">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-900 dark:text-slate-100 uppercase">
                                    {row.nama}
                                  </span>
                                  {isUpdated && row._changedFields && row._changedFields.length > 0 && (
                                    <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400">
                                      Berubah: {row._changedFields.map(f => f.field).join(", ")}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Tabungan */}
                              <td className="p-3.5 text-right font-bold text-teal-700 dark:text-teal-300">
                                Rp {(row.tabungan || 0).toLocaleString("id-ID")}
                              </td>

                              {/* Investasi */}
                              <td className="p-3.5 text-right font-bold text-blue-700 dark:text-blue-300">
                                Rp {(row.investasi || 0).toLocaleString("id-ID")}
                              </td>

                              {/* Lainnya */}
                              <td className="p-3.5 text-right font-bold text-purple-700 dark:text-purple-300">
                                Rp {(row.lainnya || 0).toLocaleString("id-ID")}
                              </td>

                              {/* Hutang */}
                              <td className="p-3.5 text-right">
                                {row.hutang > 0 ? (
                                  <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                                    Rp {(row.hutang || 0).toLocaleString("id-ID")}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Rp 0</span>
                                )}
                              </td>

                              {/* Level */}
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                                  (row.level || "").toUpperCase() === "GOLD"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : (row.level || "").toUpperCase() === "SILVER"
                                    ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                    : (row.level || "").toUpperCase() === "PLATINUM" || (row.level || "").toUpperCase() === "VIP"
                                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                                }`}>
                                  {row.level || "Bronze"}
                                </span>
                              </td>

                              {/* Poin */}
                              <td className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400">
                                ⭐ {row.poin || 0}
                              </td>

                              {/* Total Belanja Bulan Ini */}
                              <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                Rp {(row.total_belanja_bulan_ini || 0).toLocaleString("id-ID")}
                              </td>

                              {/* Peringkat */}
                              <td className="p-3.5 text-[11px] text-slate-600 dark:text-slate-400">
                                {row.peringkat || "-"}
                              </td>

                              {/* Aktivitas Terakhir (Preview) */}
                              <td className="p-3.5 text-[10.5px] text-slate-600 dark:text-slate-300">
                                <div className="truncate max-w-xs font-sans text-slate-700 dark:text-slate-300" title={row.aktivitas_terakhir}>
                                  {row.aktivitas_terakhir ? (
                                    row.aktivitas_terakhir.split("\n")[0]
                                  ) : (
                                    <span className="text-slate-400 italic">Belum ada aktivitas</span>
                                  )}
                                </div>
                              </td>

                              {/* Aksi Expand Detail */}
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId(isExpanded ? null : row._key)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#005E6A] hover:text-white dark:hover:bg-[#005E6A] text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                  <span>{isExpanded ? "Tutup" : "Detail"}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Row with Full 14-Column Multi-line Details */}
                            {isExpanded && (
                              <tr className="bg-slate-50/95 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                <td colSpan={14} className="p-5">
                                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-[#005E6A] dark:text-teal-300 flex items-center justify-center font-bold">
                                          <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase">
                                            Rincian Lengkap: {row.nama} ({row.id_pelanggan || "CUST-0000"})
                                          </h4>
                                          <p className="text-[10px] text-slate-400 uppercase">
                                            Terakhir Diperbarui: {row.terakhir_diperbarui || "-"}
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => navigate(`/admin/customers/${encodeURIComponent(row.nama)}`)}
                                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950 dark:text-teal-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                                      >
                                        <span>Buka Akun Pelanggan</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* 3 Multi-line Text Columns Sent to Google Sheets */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                      {/* Kolom 1: Aktivitas Terakhir */}
                                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2 text-[#005E6A] dark:text-teal-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Kolom: Aktivitas Terakhir (6 Transaksi)</span>
                                        </div>
                                        <pre className="text-[11px] font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                          {row.aktivitas_terakhir || "Belum ada aktivitas"}
                                        </pre>
                                      </div>

                                      {/* Kolom 2: Mutasi Tabungan (Semua Bulan, Max 10) */}
                                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold uppercase text-[10px] tracking-wider">
                                            <Wallet className="w-3.5 h-3.5" />
                                            <span>Kolom: 10 Mutasi Tabungan Terakhir</span>
                                          </div>
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                                            Semua Bulan (Max 10)
                                          </span>
                                        </div>
                                        <pre className="text-[11px] font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                          {row.mutasi_tabungan || "Belum ada mutasi tabungan"}
                                        </pre>
                                      </div>

                                      {/* Kolom 3: Catatan Hutang (Semua Bulan, Max 10) */}
                                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold uppercase text-[10px] tracking-wider">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span>Kolom: 10 Catatan Hutang Terakhir</span>
                                          </div>
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                                            Semua Bulan (Max 10)
                                          </span>
                                        </div>
                                        <pre className="text-[11px] font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                          {row.catatan_hutang || "Belum ada catatan hutang"}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="p-12 text-center text-slate-400 dark:text-slate-500">
                          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-bold">Tidak ada data pelanggan yang sesuai dengan filter.</p>
                          <button
                            onClick={() => { setSearchTerm(""); setFilterMode("all"); setLevelFilter("ALL"); }}
                            className="mt-2 text-xs text-teal-600 font-bold underline"
                          >
                            Reset Filter Pencarian
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALISIS KELENGKAPAN DATA ("APA YANG MASIH KURANG") */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* Header Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Analisis & Cek Kelengkapan Data Sebelum Masuk Google Sheets</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikut adalah pemeriksaan otomatis untuk mendeteksi data yang belum lengkap atau membutuhkan perhatian sebelum disinkronkan ke Google Spreadsheet.
              </p>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check 1: Pelanggan tanpa ID unik */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      metrics.missingIdCount === 0 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" 
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                    }`}>
                      {metrics.missingIdCount === 0 ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">
                        ID Pelanggan Unik
                      </h4>
                      <p className="text-[10px] text-slate-400">Format CUST-XXXX</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    metrics.missingIdCount === 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {metrics.missingIdCount === 0 ? "Semua Lengkap" : `${metrics.missingIdCount} Belum Ada ID`}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {metrics.missingIdCount === 0
                    ? "Seluruh data pelanggan telah memiliki ID pelanggan unik dan rapi untuk di-export ke Google Sheets."
                    : "Terdapat pelanggan yang belum memiliki kode ID unik. Sistem akan otomatis membuatkan ID saat sinkronisasi."}
                </p>
              </div>

              {/* Check 2: Pelanggan dengan Hutang Aktif */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">
                        Pelanggan Memiliki Hutang
                      </h4>
                      <p className="text-[10px] text-slate-400">Kolom Hutang & Catatan Hutang</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {metrics.withDebtCount} Pelanggan
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Total hutang yang tercatat adalah <strong className="text-rose-600">Rp {metrics.totalHutang.toLocaleString("id-ID")}</strong>. Seluruh riwayat kasbon dan pelunasan akan terangkum di Google Sheets.
                </p>
              </div>

              {/* Check 3: Pelanggan Memiliki Tabungan */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">
                        Pelanggan Memiliki Tabungan
                      </h4>
                      <p className="text-[10px] text-slate-400">Kolom Tabungan & Mutasi</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {metrics.withSavingsCount} Pelanggan
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Total saldo tabungan pelanggan adalah <strong className="text-teal-700 dark:text-teal-300">Rp {metrics.totalTabungan.toLocaleString("id-ID")}</strong>. Mutasi tabungan setor/tarik siap dikirim.
                </p>
              </div>

              {/* Check 4: Transaksi Belanja Bulan Ini */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase">
                        Aktivitas Belanja & Peringkat
                      </h4>
                      <p className="text-[10px] text-slate-400">Perhitungan Leaderboard</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {metrics.activeShoppersCount} Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Total omzet belanja tercatat bulan ini adalah <strong className="text-slate-900 dark:text-white">Rp {metrics.totalBelanja.toLocaleString("id-ID")}</strong>. Peringkat dihitung otomatis dari urutan nominal tertinggi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
