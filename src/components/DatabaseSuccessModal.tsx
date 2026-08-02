import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Database, Sparkles, X, Loader2, CloudUpload } from "lucide-react";

export interface SuccessModalData {
  title: string;
  message: string;
  details?: string;
  isDatabaseSynced?: boolean;
}

interface DatabaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SuccessModalData | null;
  autoCloseMs?: number;
  isProcessing?: boolean;
  processingTitle?: string;
  processingMessage?: string;
}

export const DatabaseSuccessModal: React.FC<DatabaseSuccessModalProps> = ({
  isOpen,
  onClose,
  data,
  autoCloseMs = 3500,
  isProcessing = false,
  processingTitle = "MEMPROSES & MENYIMPAN KE SUPABASE...",
  processingMessage = "Sedang mengirim dan mengamankan data transaksi langsung di Supabase Database..."
}) => {
  useEffect(() => {
    if (isOpen && !isProcessing && data && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isProcessing, data, autoCloseMs, onClose]);

  if (!isOpen) return null;

  const isDb = data ? data.isDatabaseSynced !== false : true;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center overflow-hidden z-10"
          >
            {/* Background Decorative Glows */}
            <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none ${isProcessing ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`} />
            <div className={`absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-3xl pointer-events-none ${isProcessing ? 'bg-blue-500/20' : 'bg-teal-500/20'}`} />

            {/* Close Button (Disabled during processing) */}
            {!isProcessing && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Icon Circle Section */}
            <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
              {isProcessing ? (
                <>
                  {/* Outer Pulsing Waves */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-sky-500/30"
                  />
                  <motion.div
                    animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-blue-500/20"
                  />
                  {/* Central Spinning Circle */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/40 text-white">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-sky-200"
                    />
                    <CloudUpload className="w-8 h-8 animate-bounce" />
                  </div>
                </>
              ) : (
                <>
                  {/* Outer pulsing ring for success */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30"
                  />
                  {/* Main Checkmark circle */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
                    className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/35 text-white"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-9 h-9 stroke-[3]" />
                    </motion.div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-3 ${
                isProcessing
                  ? "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                  <Database className="w-3.5 h-3.5" />
                  <span>Mengirim Ke Supabase</span>
                </>
              ) : isDb ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Database className="w-3.5 h-3.5" />
                  <span>Tersimpan Di Supabase</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tersimpan Lokal</span>
                </>
              )}
            </motion.div>

            {/* Modal Title */}
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-wide mb-2"
            >
              {isProcessing ? processingTitle : data?.title}
            </motion.h3>

            {/* Modal Message */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-2 leading-relaxed"
            >
              {isProcessing ? processingMessage : data?.message}
            </motion.p>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4 relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-1/2 h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full"
                />
              </div>
            )}

            {/* Details (Only for Success State) */}
            {!isProcessing && data?.details && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80"
              >
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-tight">
                  {data.details}
                </p>
              </motion.div>
            )}

            {/* Action Button (Only when not processing) */}
            {!isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6"
              >
                <button
                  onClick={onClose}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  OK / SELESAI
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
