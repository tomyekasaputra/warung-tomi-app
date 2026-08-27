import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  MinusCircle,
  Download,
  Printer,
  Share2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Loader2,
  X
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Customer,
  SavingTransaction,
  isCustomerSavingMatch,
  parseDate,
  generateNextTabunganId,
  parseCurrency,
  get4DigitCustId
} from "../App";
import { SupabaseSavingsService, SupabaseCustomerService, formatDateDDMMYYYY, CustomerSavingsMonthSummary } from "../lib/supabase";
import { downloadSavingsStatementPdf } from "../lib/pdfSavingsStatement";
import { downloadSavingsStatementExcel } from "../lib/excelSavingsStatement";
import { DatabaseSuccessModal, SuccessModalData } from "./DatabaseSuccessModal";

interface AdminSavingsDetailPageProps {
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  savingsTransactions: SavingTransaction[];
  setSavingsTransactions?: React.Dispatch<React.SetStateAction<SavingTransaction[]>>;
  dataSource?: "sheets" | "firebase";
  fetchData?: (showLoading?: boolean, collectionName?: string | string[], extraOptions?: any) => Promise<void> | void;
}

export const AdminSavingsDetailPage: React.FC<AdminSavingsDetailPageProps> = ({
  customers,
  setCustomers,
  savingsTransactions,
  setSavingsTransactions,
  dataSource = "firebase",
  fetchData
}) => {
  const { customerName } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_session") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const decodedParam = customerName ? decodeURIComponent(customerName).trim().toLowerCase() : "";

  // Cari data nasabah
  const customer = useMemo(() => {
    return (
      customers.find(
        (c) =>
          (c.id_pelanggan && c.id_pelanggan.toLowerCase() === decodedParam) ||
          (c.Nama && c.Nama.toLowerCase() === decodedParam) ||
          (c.id && c.id.toLowerCase() === decodedParam)
      ) || null
    );
  }, [customers, decodedParam]);

  // Semua transaksi nasabah ini
  const customerAllTransactions = useMemo(() => {
    if (!customer && !decodedParam) return [];
    const targetObj = customer || { Nama: decodedParam, id_pelanggan: decodedParam };
    return savingsTransactions
      .filter((t) => isCustomerSavingMatch(t, targetObj))
      .sort((a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime());
  }, [savingsTransactions, customer, decodedParam]);

  // State for Month Navigation (defaults to current month)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [typeFilter, setTypeFilter] = useState<"SEMUA" | "SETOR" | "TARIK">("SEMUA");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State untuk ringkasan bulan via RPC (hemat bandwidth)
  const [serverMonthsSummary, setServerMonthsSummary] = useState<CustomerSavingsMonthSummary[] | null>(null);
  const [serverEarliestDate, setServerEarliestDate] = useState<Date | null>(null);
  const [isLoadingMonths, setIsLoadingMonths] = useState<boolean>(false);

  // Rentang bulan yang valid: Hanya dari bulan awal pertamakali menabung hingga bulan berjalan saat ini
  const { availableMonths, minDate, maxDate, isPrevDisabled, isNextDisabled } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const maxMonthDate = new Date(currentYear, currentMonth, 1);

    // 1. Tentukan tanggal transaksi tertua nasabah (dari RPC server-side agregasi atau riwayat lokal)
    let minMonthDate = new Date(currentYear, currentMonth, 1);

    if (serverEarliestDate) {
      const sMin = new Date(serverEarliestDate.getFullYear(), serverEarliestDate.getMonth(), 1);
      if (sMin <= maxMonthDate) {
        minMonthDate = sMin;
      }
    } else if (serverMonthsSummary && serverMonthsSummary.length > 0) {
      // Ambil elemen terakhir yang merupakan bulan terawal
      const oldestMonthObj = serverMonthsSummary[serverMonthsSummary.length - 1];
      const sMin = new Date(oldestMonthObj.year, oldestMonthObj.month, 1);
      if (sMin <= maxMonthDate) {
        minMonthDate = sMin;
      }
    } else if (customerAllTransactions.length > 0) {
      let oldestTime = Infinity;
      customerAllTransactions.forEach((t) => {
        const parsed = parseDate(t.Tanggal);
        const time = parsed.getTime();
        // Pastikan timestamp valid dan lebih dari tahun 2000 (tidak 0 / 1970)
        if (time > 946684800000 && !isNaN(time) && time < oldestTime) {
          oldestTime = time;
        }
      });

      if (oldestTime !== Infinity) {
        const oldestD = new Date(oldestTime);
        const sMin = new Date(oldestD.getFullYear(), oldestD.getMonth(), 1);
        if (sMin <= maxMonthDate) {
          minMonthDate = sMin;
        }
      }
    }

    // 2. Bangun daftar bulan hanya dari minMonthDate hingga maxMonthDate (terbaru ke terlama)
    const list: { key: string; label: string; fullLabel?: string; year: number; month: number; count: number; totalSetor?: number; totalTarik?: number }[] = [];
    const loop = new Date(maxMonthDate.getFullYear(), maxMonthDate.getMonth(), 1);

    const rpcMap = new Map<string, CustomerSavingsMonthSummary>();
    if (serverMonthsSummary) {
      serverMonthsSummary.forEach((m) => rpcMap.set(m.key, m));
    }

    while (loop >= minMonthDate) {
      const yr = loop.getFullYear();
      const mo = loop.getMonth();
      const key = `${yr}-${String(mo + 1).padStart(2, "0")}`;
      const label = loop.toLocaleString("id-ID", { month: "long" });
      const fullLabel = loop.toLocaleString("id-ID", { month: "long", year: "numeric" });
      
      const rpcItem = rpcMap.get(key);
      const localCount = customerAllTransactions.filter((t) => {
        const d = parseDate(t.Tanggal);
        return d.getFullYear() === yr && d.getMonth() === mo;
      }).length;

      const count = rpcItem !== undefined ? rpcItem.count : localCount;

      list.push({
        key,
        label,
        fullLabel,
        year: yr,
        month: mo,
        count,
        totalSetor: rpcItem?.totalSetor,
        totalTarik: rpcItem?.totalTarik
      });

      // Mundur 1 bulan
      loop.setMonth(loop.getMonth() - 1);
    }

    // Cek batas navigasi tombol Prev (<) dan Next (>)
    const isPrev =
      viewDate.getFullYear() < minMonthDate.getFullYear() ||
      (viewDate.getFullYear() === minMonthDate.getFullYear() && viewDate.getMonth() <= minMonthDate.getMonth());

    const isNext =
      viewDate.getFullYear() > maxMonthDate.getFullYear() ||
      (viewDate.getFullYear() === maxMonthDate.getFullYear() && viewDate.getMonth() >= maxMonthDate.getMonth());

    return {
      availableMonths: list,
      minDate: minMonthDate,
      maxDate: maxMonthDate,
      isPrevDisabled: isPrev,
      isNextDisabled: isNext
    };
  }, [customerAllTransactions, viewDate, serverEarliestDate, serverMonthsSummary]);

  // Pastikan viewDate selalu dalam rentang valid [minDate, maxDate]
  useEffect(() => {
    if (viewDate < minDate) {
      setViewDate(minDate);
    } else if (viewDate > maxDate) {
      setViewDate(maxDate);
    }
  }, [minDate, maxDate]);

  // Delta Sync & Month-specific Fetcher to save bandwidth
  const [isSyncingMonth, setIsSyncingMonth] = useState(false);
  const lastSyncTimeRef = useRef<{ [monthKey: string]: string }>({});

  // Teknik RPC: Ambil daftar bulan & statistik mutasi per bulan dari database (SANGAT HEMAT BANDWIDTH)
  useEffect(() => {
    let isMounted = true;
    const fetchMonthsViaRpc = async () => {
      const targetName = customer?.Nama || decodedParam;
      const targetIdPel = customer?.id_pelanggan;
      if (!targetName && !targetIdPel) return;

      if (SupabaseSavingsService.isConnected()) {
        try {
          setIsLoadingMonths(true);
          const res = await SupabaseSavingsService.getCustomerSavingsMonths({
            name: targetName,
            customerId: targetIdPel
          });

          if (isMounted && res.data) {
            if (res.data.months && res.data.months.length > 0) {
              setServerMonthsSummary(res.data.months);
            }
            if (res.data.earliestDate) {
              const parsed = parseDate(res.data.earliestDate);
              if (parsed.getTime() > 946684800000 && !isNaN(parsed.getTime())) {
                setServerEarliestDate(parsed);
              }
            }
          }
        } catch (err) {
          console.warn("Gagal mengambil daftar bulan via RPC:", err);
        } finally {
          if (isMounted) setIsLoadingMonths(false);
        }
      }
    };

    fetchMonthsViaRpc();

    return () => {
      isMounted = false;
    };
  }, [customer?.Nama, customer?.id_pelanggan, decodedParam]);

  const syncMonthData = async (monthDate: Date, forceFull = false) => {
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const client = SupabaseSavingsService.getClient();

    try {
      setIsSyncingMonth(true);
      const targetName = customer?.Nama || decodedParam;
      const targetIdPel = customer?.id_pelanggan;
      const targetObj = customer || { Nama: decodedParam, id_pelanggan: decodedParam };

      if (client && SupabaseSavingsService.isConnected()) {
        const hasExistingDataForMonth = savingsTransactions.some((t) => {
          if (!isCustomerSavingMatch(t, targetObj)) return false;
          const d = parseDate(t.Tanggal);
          return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
        });

        const lastSync = !forceFull && hasExistingDataForMonth ? lastSyncTimeRef.current[monthKey] : undefined;
        
        const fetchOptions: any = {
          month: monthKey,
          ...(targetName ? { name: targetName } : {}),
          ...(targetIdPel ? { customerId: targetIdPel } : {}),
          ...(lastSync ? { since: lastSync } : {})
        };

        const res = await SupabaseSavingsService.getSavings(fetchOptions);
        
        // If specific name/id query returned 0, try fallback query for the month to catch any alias/unlinked records
        let fetchedData = res.data;
        if ((!fetchedData || fetchedData.length === 0) && !lastSync && targetName) {
          const fallbackRes = await SupabaseSavingsService.getSavings({
            month: monthKey,
            name: targetName.split(" ")[0] // try first name
          });
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            fetchedData = fallbackRes.data;
          }
        }

        if (fetchedData && fetchedData.length > 0 && setSavingsTransactions) {
          // Record sync timestamp for delta sync
          lastSyncTimeRef.current[monthKey] = new Date().toISOString();

          // Transform & merge with existing savingsTransactions
          setSavingsTransactions((prev) => {
            const existingMap = new Map<string, SavingTransaction>();
            prev.forEach((t) => {
              const id = t.id_tabungan || t.id || `${t.Tanggal}_${t.Nama}_${t.Nominal}`;
              existingMap.set(id, t);
            });

            fetchedData!.forEach((item) => {
              const mappedTx: SavingTransaction = {
                id: item.id || item.id_tabungan,
                id_tabungan: item.id_tabungan,
                id_pelanggan: item.id_pelanggan || targetIdPel || "CUST-0000",
                Tanggal: formatDateDDMMYYYY(item.tanggal),
                Nama: item.nama || item.nama_nasabah || targetName || "Nasabah",
                Tipe: (String(item.tipe || "SETOR").toUpperCase()) as "SETOR" | "TARIK",
                Nominal: Number(item.nominal || 0),
                SaldoAkhir: item.saldo_akhir !== undefined ? Number(item.saldo_akhir) : undefined,
                Berita: item.berita || item.keterangan || "-",
                Sebagian: item.sebagian !== undefined ? Number(item.sebagian) : undefined
              };
              const txKey = mappedTx.id_tabungan || mappedTx.id || `${mappedTx.Tanggal}_${mappedTx.Nama}_${mappedTx.Nominal}`;
              existingMap.set(txKey, mappedTx);
            });

            return Array.from(existingMap.values());
          });
        } else {
          lastSyncTimeRef.current[monthKey] = new Date().toISOString();
        }
      }
    } catch (err) {
      console.warn("Delta sync tabungan error:", err);
    } finally {
      setIsSyncingMonth(false);
    }
  };

  // Trigger delta sync & fetch when month changes or on mount
  useEffect(() => {
    syncMonthData(viewDate);
  }, [viewDate, customer?.Nama, decodedParam]);

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    setViewDate((prev) => {
      const nextD = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return nextD < minDate ? minDate : nextD;
    });
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    setViewDate((prev) => {
      const nextD = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return nextD > maxDate ? maxDate : nextD;
    });
  };

  const selectedMonthLabel = viewDate.toLocaleString("id-ID", { month: "long", year: "numeric" });
  const selectedMonthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;

  const initialCurrentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Modal actions
  const [isSetorOpen, setIsSetorOpen] = useState(false);
  const [isTarikOpen, setIsTarikOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);

  // E-Statement Modal State
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState<string>(`month:${initialCurrentMonthKey}`); // "month:YYYY-MM", "all", "custom", "3months"
  const [statementCustomStart, setStatementCustomStart] = useState<string>(
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString().split("T")[0]
  );
  const [statementCustomEnd, setStatementCustomEnd] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Success modal
  const [successModalData, setSuccessModalData] = useState<SuccessModalData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Selected Transaction for mini receipt
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<SavingTransaction | null>(null);

  // Transactions with calculated running balance
  const transactionsWithRunningBalance = useMemo(() => {
    const chronological = [...customerAllTransactions].sort(
      (a, b) => parseDate(a.Tanggal).getTime() - parseDate(b.Tanggal).getTime()
    );
    let running = 0;
    const mapWithBalance = chronological.map((t) => {
      const isSetor = String(t.Tipe || "").toUpperCase() === "SETOR";
      const nominal = Number(t.Nominal || 0);
      running =
        t.SaldoAkhir !== undefined && t.SaldoAkhir !== null
          ? Number(t.SaldoAkhir)
          : running + (isSetor ? nominal : -nominal);
      return {
        ...t,
        computedSaldoAkhir: running,
      };
    });
    return mapWithBalance.sort(
      (a, b) => parseDate(b.Tanggal).getTime() - parseDate(a.Tanggal).getTime()
    );
  }, [customerAllTransactions]);

  // Filtered transactions for the view (filtered by selected month)
  const filteredTransactions = useMemo(() => {
    return transactionsWithRunningBalance.filter((t) => {
      // Month filter based on viewDate
      const d = parseDate(t.Tanggal);
      if (d.getFullYear() !== viewDate.getFullYear() || d.getMonth() !== viewDate.getMonth()) {
        return false;
      }

      // Type filter
      if (typeFilter !== "SEMUA") {
        if (String(t.Tipe || "").toUpperCase() !== typeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tId = String(t.id_tabungan || t.id || "").toLowerCase();
        const tBerita = String(t.Berita || "").toLowerCase();
        const tTgl = String(t.Tanggal || "").toLowerCase();
        const tNominal = String(t.Nominal || "");
        if (!tId.includes(q) && !tBerita.includes(q) && !tTgl.includes(q) && !tNominal.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactionsWithRunningBalance, viewDate, typeFilter, searchQuery]);

  // Statistik Saldo & Mutasi
  const stats = useMemo(() => {
    let totalSetor = 0;
    let totalTarik = 0;
    let countSetor = 0;
    let countTarik = 0;

    let monthSetor = 0;
    let monthTarik = 0;
    let monthCount = 0;

    customerAllTransactions.forEach((t) => {
      const isSetor = String(t.Tipe || "").toUpperCase() === "SETOR";
      const isTarik = String(t.Tipe || "").toUpperCase() === "TARIK";
      const nominal = Number(t.Nominal || 0);

      if (isSetor) {
        totalSetor += nominal;
        countSetor++;
      }
      if (isTarik) {
        totalTarik += nominal;
        countTarik++;
      }

      const d = parseDate(t.Tanggal);
      if (d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()) {
        monthCount++;
        if (isSetor) monthSetor += nominal;
        if (isTarik) monthTarik += nominal;
      }
    });

    const currentBalance = customer ? parseCurrency(customer.Tabungan) : (totalSetor - totalTarik);

    return {
      currentBalance,
      totalSetor,
      totalTarik,
      countSetor,
      countTarik,
      totalMutasi: customerAllTransactions.length,
      monthSetor,
      monthTarik,
      monthCount
    };
  }, [customerAllTransactions, customer, viewDate]);

  // Data transaksi untuk E-Statement berdasarkan pilihan periode di modal (dengan saldo awal/akhir yang akurat)
  const statementData = useMemo(() => {
    // 1. Urutkan seluruh transaksi nasabah secara kronologis dari terlama ke terbaru
    const chronologicalAll = [...customerAllTransactions].sort(
      (a, b) => parseDate(a.Tanggal).getTime() - parseDate(b.Tanggal).getTime()
    );

    // 2. Hitung running balance kumulatif untuk seluruh transaksi dari awal
    let running = 0;
    const allWithBalance = chronologicalAll.map((t) => {
      const isSetor = String(t.Tipe || "").toUpperCase() === "SETOR";
      const isTarik = String(t.Tipe || "").toUpperCase() === "TARIK";
      const nominal = Number(t.Nominal || 0);
      running =
        t.SaldoAkhir !== undefined && t.SaldoAkhir !== null
          ? Number(t.SaldoAkhir)
          : running + (isSetor ? nominal : -nominal);
      return {
        ...t,
        nominal,
        isSetor,
        isTarik,
        runningBal: running,
        dateObj: parseDate(t.Tanggal)
      };
    });

    let periodLabel = "Semua Riwayat Transaksi";
    let priorTxs: typeof allWithBalance = [];
    let periodTxs: typeof allWithBalance = [];

    if (statementPeriod.startsWith("month:")) {
      const monthKey = statementPeriod.replace("month:", "");
      const [yearStr, monthStr] = monthKey.split("-");
      const yr = Number(yearStr);
      const mo = Number(monthStr);
      const monthStartDate = new Date(yr, mo - 1, 1, 0, 0, 0, 0);
      const monthEndDate = new Date(yr, mo, 0, 23, 59, 59, 999);
      periodLabel = monthStartDate.toLocaleString("id-ID", { month: "long", year: "numeric" });

      priorTxs = allWithBalance.filter((t) => t.dateObj < monthStartDate);
      periodTxs = allWithBalance.filter((t) => t.dateObj >= monthStartDate && t.dateObj <= monthEndDate);
    } else if (statementPeriod === "3months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      periodLabel = `3 Bulan Terakhir (${threeMonthsAgo.toLocaleDateString("id-ID")} - ${new Date().toLocaleDateString("id-ID")})`;

      priorTxs = allWithBalance.filter((t) => t.dateObj < threeMonthsAgo);
      periodTxs = allWithBalance.filter((t) => t.dateObj >= threeMonthsAgo);
    } else if (statementPeriod === "custom") {
      const s = new Date(statementCustomStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(statementCustomEnd);
      e.setHours(23, 59, 59, 999);
      periodLabel = `${s.toLocaleDateString("id-ID")} s/d ${e.toLocaleDateString("id-ID")}`;

      priorTxs = allWithBalance.filter((t) => t.dateObj < s);
      periodTxs = allWithBalance.filter((t) => t.dateObj >= s && t.dateObj <= e);
    } else {
      // "all"
      periodLabel = "Semua Riwayat (Dari Awal)";
      priorTxs = [];
      periodTxs = allWithBalance;
    }

    // Saldo Awal sebelum periode yang dipilih
    const initialBalance = priorTxs.length > 0 ? priorTxs[priorTxs.length - 1].runningBal : 0;

    let periodSetor = 0;
    let periodTarik = 0;

    const formattedRows = periodTxs.map((t, idx) => {
      if (t.isSetor) periodSetor += t.nominal;
      if (t.isTarik) periodTarik += t.nominal;

      return {
        no: idx + 1,
        id: t.id_tabungan || t.id || `TAB-${idx + 1}`,
        tanggal: t.Tanggal,
        keterangan:
          t.Berita && t.Berita !== "-" && t.Berita.trim() !== ""
            ? t.Berita
            : t.isSetor
            ? "Setor Tabungan"
            : "Tarik Saldo",
        tipe: t.Tipe,
        debet: t.isTarik ? t.nominal : 0,
        kredit: t.isSetor ? t.nominal : 0,
        saldo: t.runningBal
      };
    });

    const saldoAwal = Math.max(0, initialBalance);
    const saldoAkhir = formattedRows.length > 0
      ? formattedRows[formattedRows.length - 1].saldo
      : saldoAwal;

    return {
      periodLabel,
      rows: formattedRows,
      periodSetor,
      periodTarik,
      saldoAwal,
      saldoAkhir,
      totalCount: formattedRows.length
    };
  }, [customerAllTransactions, statementPeriod, statementCustomStart, statementCustomEnd]);

  // Handle Eksekusi Setor / Tarik Tabungan
  const handleExecuteTransaction = async (type: "SETOR" | "TARIK") => {
    if (!customer) {
      alert("Data nasabah tidak ditemukan.");
      return;
    }
    const cleanAmount = parseInt(modalAmount.replace(/[^\d]/g, ""), 10);
    if (!cleanAmount || cleanAmount <= 0) {
      alert("Harap masukkan nominal transaksi yang valid.");
      return;
    }

    const currentTabungan = parseCurrency(customer.Tabungan);
    if (type === "TARIK" && cleanAmount > currentTabungan) {
      alert(`Saldo tidak mencukupi. Saldo saat ini: Rp ${currentTabungan.toLocaleString("id-ID")}`);
      return;
    }

    const newSaldo = type === "SETOR" ? currentTabungan + cleanAmount : Math.max(0, currentTabungan - cleanAmount);
    const todayStr = formatDateDDMMYYYY();
    const idTabungan = generateNextTabunganId(customer, savingsTransactions, customers);

    setIsSavingAction(true);

    const newTx: SavingTransaction = {
      id: idTabungan,
      id_tabungan: idTabungan,
      id_pelanggan: customer.id_pelanggan || "",
      Tanggal: todayStr,
      Nama: customer.Nama,
      Tipe: type,
      Nominal: cleanAmount,
      SaldoAkhir: newSaldo,
      Berita: modalNote.trim() || ""
    };

    // Update state transaksi
    if (setSavingsTransactions) {
      setSavingsTransactions((prev) => [newTx, ...prev]);
    }

    // Update saldo customer
    if (setCustomers) {
      setCustomers((prev) =>
        prev.map((c) =>
          (c.id_pelanggan && c.id_pelanggan === customer.id_pelanggan) || c.Nama === customer.Nama
            ? { ...c, Tabungan: newSaldo }
            : c
        )
      );
    }

    // Simpan ke Supabase jika terhubung
    if (SupabaseSavingsService.isConnected()) {
      try {
        await SupabaseSavingsService.addSavingTransaction({
          id_tabungan: idTabungan,
          id_pelanggan: customer.id_pelanggan || "",
          tanggal: todayStr,
          nama: customer.Nama,
          tipe: type,
          nominal: cleanAmount,
          saldo_akhir: newSaldo,
          berita: modalNote.trim() || null
        });

        if (SupabaseCustomerService.isConnected()) {
          await SupabaseCustomerService.upsertCustomer({
            id_pelanggan: customer.id_pelanggan || customer.Nama,
            nama: customer.Nama,
            tabungan: newSaldo
          });
        }
      } catch (err) {
        console.error("Gagal simpan transaksi tabungan ke Supabase:", err);
      }
    }

    setIsSavingAction(false);
    setIsSetorOpen(false);
    setIsTarikOpen(false);
    setModalAmount("");
    setModalNote("");

    setSuccessModalData({
      title: `${type === "SETOR" ? "SETORAN" : "PENARIKAN"} TABUNGAN BERHASIL`,
      message: `Transaksi tabungan Rp ${cleanAmount.toLocaleString("id-ID")} untuk nasabah ${customer.Nama} telah sukses disimpan!`,
      details: `ID Transaksi: ${idTabungan} • Saldo Baru: Rp ${newSaldo.toLocaleString("id-ID")}`,
      isDatabaseSynced: true
    });
    setIsSuccessModalOpen(true);
  };

  // Helper Export PDF e-Statement via jsPDF + jsPDF-autotable
  const [downloadingMonthKey, setDownloadingMonthKey] = useState<string | null>(null);
  const [downloadingMonthExcelKey, setDownloadingMonthExcelKey] = useState<string | null>(null);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handleDownloadMonthPdf = async (monthKey: string, monthLabel: string) => {
    if (!customer) return;
    try {
      setDownloadingMonthKey(monthKey);
      await downloadSavingsStatementPdf(customer, customerAllTransactions, monthKey, monthLabel);
    } catch (err) {
      console.error('Gagal download statement PDF:', err);
    } finally {
      setDownloadingMonthKey(null);
    }
  };

  const handleDownloadMonthExcel = async (monthKey: string, monthLabel: string) => {
    if (!customer) return;
    try {
      setDownloadingMonthExcelKey(monthKey);
      await downloadSavingsStatementExcel(customer, customerAllTransactions, monthKey, monthLabel);
    } catch (err) {
      console.error('Gagal download statement Excel:', err);
    } finally {
      setDownloadingMonthExcelKey(null);
    }
  };

  // Helper Export PDF e-Statement via downloadSavingsStatementPdf (Semua Riwayat)
  const handleDownloadPdf = async () => {
    if (!customer) return;
    setIsGeneratingPdf(true);
    try {
      await downloadSavingsStatementPdf(customer, customerAllTransactions, 'all', 'Semua Riwayat Transaksi');
    } catch (err) {
      console.error('Gagal generate PDF e-Statement:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper Export Excel e-Statement via downloadSavingsStatementExcel (Semua Riwayat)
  const handleDownloadAllExcel = async () => {
    if (!customer) return;
    setIsGeneratingExcel(true);
    try {
      await downloadSavingsStatementExcel(customer, customerAllTransactions, 'all', 'Semua Riwayat Transaksi');
    } catch (err) {
      console.error('Gagal generate Excel e-Statement:', err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  // Helper Browser Print Dialog
  const handlePrintBrowser = () => {
    window.print();
  };

  // Helper Share to WhatsApp
  const handleShareWhatsApp = () => {
    if (!customer) return;
    const phone = customer.Telepon || customer.telepon || "";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const waNumber = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

    const message = `*📄 E-STATEMENT TABUNGAN WARUNG TOMI*\n\n` +
      `👤 *Nasabah:* ${customer.Nama}\n` +
      `🆔 *No. Rekening:* ${customer.id_pelanggan || get4DigitCustId(customer.id_pelanggan, customer.Nama)}\n` +
      `📅 *Periode:* ${statementData.periodLabel}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Saldo Awal:* Rp ${statementData.saldoAwal.toLocaleString("id-ID")}\n` +
      `📥 *Total Setor (+):* Rp ${statementData.periodSetor.toLocaleString("id-ID")}\n` +
      `📤 *Total Tarik (-):* Rp ${statementData.periodTarik.toLocaleString("id-ID")}\n` +
      `💳 *Saldo Akhir:* Rp ${statementData.saldoAkhir.toLocaleString("id-ID")}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Terima kasih telah mempercayakan tabungan Anda di *Warung Tomi*! Simpanan Anda aman & berkah.`;

    const waUrl = waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  if (!customer && !decodedParam) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-bold text-slate-500">Nasabah tidak ditemukan.</p>
        <Link
          to="/admin/savings"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#005E6A] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Tabungan
        </Link>
      </div>
    );
  }

  const custName = customer?.Nama || decodedParam || "Nasabah";
  const custId = customer?.id_pelanggan || get4DigitCustId(customer?.id_pelanggan, custName) || "-";
  const custPhone = customer?.Telepon || customer?.telepon || "-";
  const custAddress = customer?.Alamat || customer?.alamat || "Pelanggan Warung Tomi";

  return (
    <div className="space-y-4 pb-28">
      {/* 1. HEADER WARNA BIRU BNI (Berisi: Back Button, Nama, Saldo, dan e-Statement) */}
      <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-[#005E6A] via-[#004e58] to-[#003840] text-white p-5 sm:p-7 shadow-lg border-b border-teal-500/20 space-y-5">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#F15A24]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Row: Back Button & Nama Nasabah (Kiri) dan Tombol e-Statement (Kanan) Sejajar */}
        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              onClick={() => navigate("/admin/savings")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 shrink-0 cursor-pointer"
              title="Kembali ke Manajemen Tabungan"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-teal-200/90 truncate">
                <span>Manajemen Tabungan</span>
                <span>/</span>
                <span>Detail Nasabah</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white truncate">
                {custName}
              </h1>
            </div>
          </div>

          {/* e-Statement Button in Header (Kanan Sejajar) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsStatementModalOpen(true)}
            className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/20 shadow-sm flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200" />
            <span>e-Statement (PDF)</span>
          </motion.button>
        </div>

        {/* Middle Row: Total Saldo Tabungan */}
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-teal-200 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Total Saldo Tabungan
          </span>
          <div className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Rp {stats.currentBalance.toLocaleString("id-ID")}
          </div>
          <p className="text-[10px] text-teal-100/70 font-medium pt-0.5">
            Tersinkronisasi otomatis dengan Database Warung Tomi
          </p>
        </div>
      </div>

      {/* 2. PILIH BULAN (Tinggi & Tebal, Hanya Beroperasi dari Awal Menabung s/d Bulan Berjalan) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-5">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className={`p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center shadow-xs ${
            isPrevDisabled
              ? "opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 cursor-pointer"
          }`}
          title={isPrevDisabled ? "Bulan awal menabung tercapai" : "Bulan Sebelumnya"}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 sm:py-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#005E6A] dark:text-teal-400 shrink-0" />
            <select
              value={selectedMonthKey}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-");
                setViewDate(new Date(Number(y), Number(m) - 1, 1));
              }}
              className="bg-transparent font-black text-xs sm:text-sm md:text-base uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none cursor-pointer text-center appearance-none pr-4"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key} className="dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                  {m.label} {m.count > 0 ? `(${m.count})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 -ml-2 pointer-events-none" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center shadow-xs ${
            isNextDisabled
              ? "opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 cursor-pointer"
          }`}
          title={isNextDisabled ? "Bulan berjalan saat ini" : "Bulan Berikutnya"}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3. ELEMEN UTAMA: KARTU RINGKASAN TERPADU BERSATU DENGAN TABEL */}
      <div className="px-3 sm:px-5">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          {/* Header Ringkasan Mutasi Terpadu (Setoran, Penarikan, Mutasi) */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 text-center py-3 sm:py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
            <div className="px-2 sm:px-4">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Setoran
              </p>
              <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                +Rp {stats.monthSetor.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="px-2 sm:px-4">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Penarikan
              </p>
              <p className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                -Rp {stats.monthTarik.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="px-2 sm:px-4">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mutasi
              </p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {stats.monthCount} Transaksi
              </p>
            </div>
          </div>

          {/* Tabel Mutasi Tabungan */}
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">TANGGAL</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">SETOR</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">TARIK</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">SALDO AKHIR</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTransactions.map((tx, idx) => {
                    const isSetor = String(tx.Tipe || "").toUpperCase() === "SETOR";
                    const isTarik = String(tx.Tipe || "").toUpperCase() === "TARIK";
                    const nominal = Number(tx.Nominal || 0);
                    const finalBal =
                      tx.computedSaldoAkhir !== undefined
                        ? tx.computedSaldoAkhir
                        : tx.SaldoAkhir !== undefined
                        ? Number(tx.SaldoAkhir)
                        : 0;

                    return (
                      <tr
                        key={tx.id_tabungan || tx.id || idx}
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="hover:bg-teal-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Klik untuk melihat struk mutasi"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {tx.Tanggal}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isSetor ? `+Rp ${nominal.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {isTarik ? `-Rp ${nominal.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          Rp {finalBal.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {tx.Berita && tx.Berita !== "-" && tx.Berita.trim() !== ""
                            ? tx.Berita
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Tidak ada mutasi tabungan pada bulan {selectedMonthLabel}
              </p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Gunakan navigasi tanggal di atas untuk berpindah ke bulan lain atau lakukan transaksi baru.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. MODAL E-STATEMENT GENERATOR (SIMPLIFIED: KIRI BULAN/TAHUN, KANAN PDF) */}
      <AnimatePresence>
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatementModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F15A24] flex items-center justify-center border border-orange-200/60 dark:border-orange-800/40">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      e-Statement Tabungan
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {custName} • {custId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStatementModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title Section */}
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black text-[#005E6A] dark:text-teal-400 uppercase tracking-wider">
                  DAFTAR PERIODE BULANAN
                </p>
                <span className="text-[10px] font-bold text-slate-400">
                  {availableMonths.length} Periode
                </span>
              </div>

              {/* List of Months: Kiri Bulan/Tahun, Kanan Tombol PDF */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar max-h-[50vh]">
                {availableMonths.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Belum ada riwayat transaksi tabungan.</p>
                  </div>
                ) : (
                  availableMonths.map((m) => (
                    <div
                      key={m.key}
                      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-teal-200 dark:hover:border-teal-800 transition-all"
                    >
                      {/* Sebelah Kiri: Bulan dan Tahun */}
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#005E6A] dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                            {m.label}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {m.count} Transaksi
                          </span>
                        </div>
                      </div>

                      {/* Sebelah Kanan: Tombol Excel & PDF Dipisah Garis Pembatas Halus */}
                      <div className="shrink-0 flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-600/80 shadow-2xs">
                        {/* Tombol Excel */}
                        <button
                          type="button"
                          disabled={downloadingMonthExcelKey === m.key}
                          title={`Download e-Statement Excel ${m.label}`}
                          onClick={() => {
                            handleDownloadMonthExcel(m.key, m.label);
                          }}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          {downloadingMonthExcelKey === m.key ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingMonthExcelKey === m.key ? "MEMUAT..." : "EXCEL"}</span>
                        </button>

                        {/* Garis Pembatas Halus */}
                        <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                        {/* Tombol PDF */}
                        <button
                          type="button"
                          disabled={downloadingMonthKey === m.key}
                          title={`Download e-Statement PDF ${m.label}`}
                          onClick={() => {
                            handleDownloadMonthPdf(m.key, m.label);
                          }}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          {downloadingMonthKey === m.key ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingMonthKey === m.key ? "MEMUAT..." : "PDF"}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tombol Unduh Semua Riwayat & Tutup */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdf}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#005E6A] hover:bg-[#004852] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>{isGeneratingPdf ? "Memuat PDF..." : "Semua Riwayat (PDF)"}</span>
                </button>
                <button
                  type="button"
                  disabled={isGeneratingExcel}
                  onClick={handleDownloadAllExcel}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  <span>{isGeneratingExcel ? "Memuat Excel..." : "Semua Riwayat (Excel)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStatementModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. NAVBAR DIAM (FIXED BOTTOM BAR) DENGAN TOMBOL SETOR DAN TARIK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => {
              setModalAmount("");
              setModalNote("");
              setIsSetorOpen(true);
            }}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Setor Tabungan</span>
          </button>

          <button
            onClick={() => {
              setModalAmount("");
              setModalNote("");
              setIsTarikOpen(true);
            }}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Tarik Saldo</span>
          </button>
        </div>
      </div>

      {/* MODAL SETOR (BOTTOM SIDE / BOTTOM SHEET) */}
      <AnimatePresence>
        {isSetorOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSetorOpen(false)}
              className="fixed inset-0"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-3" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Setor Tabungan Nasabah
                  </h3>
                </div>
                <button
                  onClick={() => setIsSetorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Nasabah:</p>
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">{custName}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Saldo Saat Ini: Rp {stats.currentBalance.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Nominal Setor (Rp) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="100.000"
                      value={modalAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setModalAmount(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Keterangan / Berita (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Setoran Harian Warung"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setIsSetorOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingAction}
                  onClick={() => handleExecuteTransaction("SETOR")}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingAction ? "Menyimpan..." : "Simpan Setoran"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TARIK SALDO (BOTTOM SIDE / BOTTOM SHEET) */}
      <AnimatePresence>
        {isTarikOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTarikOpen(false)}
              className="fixed inset-0"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-3" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Tarik Saldo Tabungan
                  </h3>
                </div>
                <button
                  onClick={() => setIsTarikOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-200/60">
                <p className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase">Nasabah:</p>
                <p className="text-sm font-black text-rose-900 dark:text-rose-200">{custName}</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-400">
                  Saldo Maksimal: Rp {stats.currentBalance.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Nominal Penarikan (Rp) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="50.000"
                      value={modalAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setModalAmount(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-[#005E6A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Keterangan / Keperluan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pencairan Dana Belanja"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setIsTarikOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingAction}
                  onClick={() => handleExecuteTransaction("TARIK")}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingAction ? "Menyimpan..." : "Simpan Penarikan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL STRUK MUTASI TABUNGAN */}
      <AnimatePresence>
        {selectedTxForReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            >
              <div className="text-center space-y-1 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
                <h4 className="text-base font-black text-[#005E6A] dark:text-teal-400">WARUNG TOMI</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Bukti Mutasi Tabungan
                </p>
              </div>

              <div className="space-y-2 text-xs py-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Transaksi:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {selectedTxForReceipt.id_tabungan || selectedTxForReceipt.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedTxForReceipt.Tanggal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nasabah:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedTxForReceipt.Nama}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jenis Transaksi:</span>
                  <span
                    className={`font-black uppercase ${
                      String(selectedTxForReceipt.Tipe).toUpperCase() === "SETOR"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {selectedTxForReceipt.Tipe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Keterangan:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedTxForReceipt.Berita || "-"}
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Nominal:</span>
                  <span className="text-base font-black text-[#005E6A] dark:text-teal-400">
                    Rp {Number(selectedTxForReceipt.Nominal || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                {selectedTxForReceipt.SaldoAkhir !== undefined && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Saldo Akhir:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      Rp {Number(selectedTxForReceipt.SaldoAkhir).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxForReceipt(null)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs"
                >
                  Tutup Struk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Database Success Modal */}
      <DatabaseSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        data={successModalData}
      />
    </div>
  );
};
