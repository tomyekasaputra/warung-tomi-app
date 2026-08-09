import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle, LogOut, 
  ExternalLink, ShieldCheck, Database, Lock, ArrowRight, Zap, Check
} from "lucide-react";
import { 
  checkGoogleSheetsAuthStatus, 
  getGoogleOAuthUrl, 
  disconnectGoogleAuth, 
  syncCustomersToGoogleSheets, 
  updateGoogleSheetsConfig, 
  GoogleSheetsAuthStatus,
  CustomerSyncPayload
} from "../lib/googleSheetsSync";

interface GoogleSheetsSyncCardProps {
  customers: CustomerSyncPayload[];
  title?: string;
  onSyncSuccess?: (result: any) => void;
  autoSyncOnLoad?: boolean;
}

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({
  customers,
  title = "Data Pelanggan - Warung Tomi",
  onSyncSuccess,
  autoSyncOnLoad = true
}) => {
  const [authStatus, setAuthStatus] = useState<GoogleSheetsAuthStatus>({ authenticated: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const status = await checkGoogleSheetsAuthStatus();
    setAuthStatus(status);
    setLoading(false);
    return status;
  };

  useEffect(() => {
    fetchStatus();

    // Listen to OAuth success postMessage from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "GOOGLE_AUTH_SUCCESS") {
        fetchStatus().then((status) => {
          if (status.authenticated) {
            setStatusMsg({ type: "success", text: "Berhasil terhubung ke akun Google!" });
            setTimeout(() => setStatusMsg(null), 4000);
          }
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Trigger auto-sync when customers change if authenticated and autoSyncEnabled is true
  useEffect(() => {
    if (authStatus.authenticated && authStatus.autoSyncEnabled && customers.length > 0 && autoSyncOnLoad && !syncing) {
      handleSync(true);
    }
  }, [customers.length, authStatus.authenticated, authStatus.autoSyncEnabled]);

  const handleConnectGoogle = async () => {
    try {
      const url = await getGoogleOAuthUrl();
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        "google_sheets_oauth",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        // Fallback to same-window navigation if popup is blocked
        window.location.href = url;
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Gagal membimbing koneksi Google" });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan koneksi Google Sheets?")) return;
    setLoading(true);
    await disconnectGoogleAuth();
    await fetchStatus();
    setStatusMsg({ type: "info", text: "Koneksi Google Sheets berhasil diputuskan." });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleAutoSync = async () => {
    const nextVal = !authStatus.autoSyncEnabled;
    setAuthStatus(prev => ({ ...prev, autoSyncEnabled: nextVal }));
    await updateGoogleSheetsConfig({ autoSync: nextVal });
    setStatusMsg({
      type: "info",
      text: nextVal ? "Singkronisasi otomatis diaktifkan" : "Singkronisasi otomatis dinonaktifkan"
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSync = async (isAuto = false) => {
    if (!authStatus.authenticated) {
      if (!isAuto) {
        setStatusMsg({ type: "error", text: "Silakan hubungkan akun Google terlebih dahulu" });
      }
      return;
    }

    setSyncing(true);
    if (!isAuto) {
      setStatusMsg({ type: "info", text: "Mengirim data ke Google Sheets..." });
    }

    const res = await syncCustomersToGoogleSheets(customers, title);

    setSyncing(false);

    if (res.success) {
      const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(timeStr);
      setAuthStatus(prev => ({
        ...prev,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl
      }));

      setStatusMsg({
        type: "success",
        text: `✓ ${res.totalSynced || customers.length} data pelanggan tersingkron ke Google Sheets (${timeStr})`
      });

      if (onSyncSuccess) onSyncSuccess(res);
      setTimeout(() => setStatusMsg(null), 5000);
    } else {
      setStatusMsg({
        type: "error",
        text: res.message || res.error || "Gagal menyinkronkan data"
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-teal-100 dark:border-teal-900/40 space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Google Sheets Auto-Sync
              </h3>
              {authStatus.authenticated ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Terhubung
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Belum Login
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-0.5">
              Singkronisasi Otomatis Pelanggan: Nama, Tabungan, Investasi, Lainnya, Hutang, Level & Poin
            </p>
          </div>
        </div>

        {/* Action Toggle or Login */}
        <div className="flex items-center gap-2">
          {authStatus.authenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAutoSync}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                  authStatus.autoSyncEnabled
                    ? "bg-teal-50 text-[#005E6A] border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800"
                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
                title="Tombol Aktif/Nonaktifkan Singkronisasi Otomatis"
              >
                <Zap className={`w-3.5 h-3.5 ${authStatus.autoSyncEnabled ? "text-[#005E6A] fill-teal-500" : ""}`} />
                <span>Otomatis: {authStatus.autoSyncEnabled ? "AKTIF" : "OFF"}</span>
              </button>

              <button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className="px-4 py-2 bg-[#005E6A] hover:bg-[#004b54] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Hubungkan Google Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all ${
          statusMsg.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800" 
            : statusMsg.type === "error"
            ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800"
            : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800"
        }`}>
          {statusMsg.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {statusMsg.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {statusMsg.type === "info" && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
          <span className="flex-1">{statusMsg.text}</span>
        </div>
      )}

      {/* Synchronized Columns Preview Badge Grid */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
            Kolom Data Pelanggan yang Disinkronkan:
          </p>
          <span className="text-[10px] font-black text-[#005E6A] dark:text-teal-300 uppercase">
            Total {customers.length} Pelanggan
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            "ID Pelanggan",
            "Nama Pelanggan",
            "Tabungan (Rp)",
            "Investasi (Rp)",
            "Lainnya (Rp)",
            "Hutang (Rp)",
            "Level",
            "Poin",
            "Waktu Update"
          ].map((col, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3 text-emerald-500" />
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Connected Account Footer */}
      {authStatus.authenticated && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {authStatus.user?.picture && (
              <img src={authStatus.user.picture} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span>
              {authStatus.user?.email || "Google Account Connected"}
            </span>
            {lastSyncTime && (
              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-300">
                • Terakhir sync: {lastSyncTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {authStatus.spreadsheetUrl && (
              <a
                href={authStatus.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#005E6A] dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/60 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
              >
                <span>Buka Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={handleDisconnect}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Putuskan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsSyncCard;
