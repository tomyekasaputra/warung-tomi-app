import React, { useState, useEffect } from "react";
import { fetchDigiflazzBalance } from "../lib/digiflazz";
import { Wallet, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export const DigiflazzBalanceWidget: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [useProd, setUseProd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadBalance = async (isProd: boolean) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchDigiflazzBalance(isProd);
      if (res && res.data) {
        if (typeof res.data.deposit === "number") {
          setBalance(res.data.deposit);
          setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } else if (res.data.message) {
          setErrorMessage(res.data.message);
          setBalance(res.data.deposit ?? 0);
        } else {
          setBalance(0);
        }
      } else {
        setErrorMessage("Gagal menghubungkan ke server Digiflazz.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error mengambil saldo Digiflazz");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance(useProd);
  }, [useProd]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 shadow-xl border border-teal-500/20 relative overflow-hidden my-4">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                  Saldo Deposit Digiflazz
                </h3>
                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${
                  useProd 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {useProd ? "PRODUCTION" : "DEV TESTING"}
                </span>
              </div>
              <p className="text-[9px] font-semibold text-slate-400">
                PPOB Pulsa, Data, PLN & Voucher Server
              </p>
            </div>
          </div>

          <button
            onClick={() => loadBalance(useProd)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
            title="Refresh Saldo Real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Balance Display */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
              Real-time Saldo Deposit
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-teal-300 flex items-baseline gap-1">
              <span className="text-sm text-teal-400/80 font-sans">Rp</span>
              {balance !== null 
                ? balance.toLocaleString("id-ID") 
                : isLoading 
                  ? "..." 
                  : "0"}
            </div>
          </div>

          {/* Key Mode Toggle & Update Status */}
          <div className="flex flex-col sm:items-end gap-1">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setUseProd(false)}
                className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                  !useProd 
                    ? "bg-amber-500 text-slate-950 shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dev Key
              </button>
              <button
                onClick={() => setUseProd(true)}
                className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                  useProd 
                    ? "bg-emerald-500 text-slate-950 shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Prod Key
              </button>
            </div>

            {lastUpdated && !isLoading && (
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Diperbarui {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Error or Notice Alert if applicable */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Catatan API: {errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-800/80 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            Terhubung via Server Proxy Digiflazz (`/api/digiflazz/cek-saldo`)
          </span>
          <span className="text-slate-500">Username: hohebuo6jzVo</span>
        </div>
      </div>
    </div>
  );
};
