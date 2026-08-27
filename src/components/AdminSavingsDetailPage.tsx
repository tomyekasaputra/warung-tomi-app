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
    const list: { key: string; label: string; year: number; month: number; count: number; totalSetor?: number; totalTarik?: number }[] = [];
    const loop = new Date(maxMonthDate.getFullYear(), maxMonthDate.getMonth(), 1);

    const rpcMap = new Map<string, CustomerSavingsMonthSummary>();
    if (serverMonthsSummary) {
      serverMonthsSummary.forEach((m) => rpcMap.set(m.key, m));
    }

    while (loop >= minMonthDate) {
      const yr = loop.getFullYear();
      const mo = loop.getMonth();
      const key = `${yr}-${String(mo + 1).padStart(2, "0")}`;
      const label = loop.toLocaleString("id-ID", { month: "long", year: "numeric" });
      
      const rpcItem = rpcMap.get(key);
      const localCount = customerAllTransactions.filter((t) => {
        const d = parseDate(t.Tanggal);
        return d.getFullYear() === yr && d.getMonth() === mo;
      }).length;

      const count = rpcItem !== undefined ? rpcItem.count : localCount;

      list.push({
        key,
        label,
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
  const handleDownloadPdf = () => {
    if (!customer) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const custName = customer.Nama || "Nasabah";
      const custId = customer.id_pelanggan || get4DigitCustId(customer.id_pelanggan, customer.Nama) || "-";
      const custPhone = customer.Telepon || customer.telepon || "-";
      const custAddress = customer.Alamat || customer.alamat || "Pelanggan Warung Tomi";
      const printDate = new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Top Primary Header Banner (BNI Blue #005E6A)
      doc.setFillColor(0, 94, 106); // #005E6A
      doc.rect(0, 0, 210, 28, "F");

      // Brand Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("WARUNG TOMI", 14, 12);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("LAYANAN TABUNGAN & KEUANGAN DIGITAL KELUARGA", 14, 17);
      doc.setFontSize(7.5);
      doc.text("Sistem Pembukuan & Tabungan Terpercaya Komunitas", 14, 22);

      // Statement Title (Right Top)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("REKENING KORAN", 196, 12, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("e-Statement Tabungan Nasabah", 196, 17, { align: "right" });
      doc.text(`Periode: ${statementData.periodLabel}`, 196, 22, { align: "right" });

      // Orange divider line (#F15A24)
      doc.setFillColor(241, 90, 36);
      doc.rect(0, 28, 210, 2, "F");

      // Box Informasi Nasabah & Rekening
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 34, 182, 32, 2, 2, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, 182, 32, 2, 2, "S");

      // Left Column: Data Nasabah
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("NAMA PEMILIK REKENING", 20, 42);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(custName.toUpperCase(), 20, 48);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("ALAMAT / WILAYAH", 20, 56);
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(custAddress.substring(0, 45), 20, 61);

      // Right Column: Info Akun
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("NO. REKENING / ID", 120, 42);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 94, 106);
      doc.text(custId, 120, 48);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("NO. TELEPON / WA", 120, 56);
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(custPhone, 120, 61);

      doc.text("STATUS: AKTIF", 170, 48, { align: "right" });
      doc.text("MATA UANG: IDR", 170, 61, { align: "right" });

      // Box Ringkasan Saldo (Account Summary Grid)
      const sumY = 70;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, sumY, 182, 18, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, sumY, 182, 18, "S");

      // Saldo Awal
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("SALDO AWAL", 18, sumY + 6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`Rp ${statementData.saldoAwal.toLocaleString("id-ID")}`, 18, sumY + 13);

      // Total Setoran (+)
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL SETORAN (+)", 65, sumY + 6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 149, 106); // Green
      doc.text(`+Rp ${statementData.periodSetor.toLocaleString("id-ID")}`, 65, sumY + 13);

      // Total Tarikan (-)
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL PENARIKAN (-)", 115, sumY + 6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(`-Rp ${statementData.periodTarik.toLocaleString("id-ID")}`, 115, sumY + 13);

      // Saldo Akhir
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("SALDO AKHIR", 160, sumY + 6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 94, 106); // BNI Blue
      doc.text(`Rp ${statementData.saldoAkhir.toLocaleString("id-ID")}`, 160, sumY + 13);

      // Table of Mutations
      const tableData = statementData.rows.map((r) => [
        r.no.toString(),
        r.tanggal,
        r.id,
        r.keterangan,
        r.debet > 0 ? `Rp ${r.debet.toLocaleString("id-ID")}` : "-",
        r.kredit > 0 ? `Rp ${r.kredit.toLocaleString("id-ID")}` : "-",
        `Rp ${r.saldo.toLocaleString("id-ID")}`
      ]);

      autoTable(doc, {
        startY: 92,
        head: [["No", "Tanggal", "ID Mutasi", "Keterangan / Berita", "Debet (-)", "Kredit (+)", "Saldo (Rp)"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [0, 94, 106],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 28, halign: "left" },
          3: { cellWidth: 50, halign: "left" },
          4: { cellWidth: 22, halign: "right", textColor: [225, 29, 72] },
          5: { cellWidth: 22, halign: "right", textColor: [16, 149, 106] },
          6: { cellWidth: 26, halign: "right", fontStyle: "bold", textColor: [0, 94, 106] }
        },
        styles: {
          fontSize: 7,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          overflow: "linebreak"
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14, bottom: 35 }
      });

      // Footer & Disclaimer Section at bottom of page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer lines & note
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 275, 196, 275);

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text(
          "Dokumen ini dicetak otomatis oleh Sistem Digital Warung Tomi dan sah secara elektronik tanpa tanda tangan basah.",
          14,
          279
        );
        doc.text(
          `Dicetak pada: ${printDate} WIB • Database Supabase ID: ${custId} • Halaman ${i} dari ${pageCount}`,
          14,
          283
        );

        // Authenticity stamp badge
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 94, 106);
        doc.text("[ VERIFIED E-STATEMENT • WARUNG TOMI ]", 196, 283, { align: "right" });
      }

      // Save PDF file
      const safeName = custName.replace(/[^a-zA-Z0-9]/g, "_");
      const safePeriod = statementData.periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`e-Statement_Tabungan_${safeName}_${safePeriod}.pdf`);
    } catch (err) {
      console.error("Gagal generate PDF e-Statement:", err);
      alert("Gagal membuat file PDF e-Statement.");
    } finally {
      setIsGeneratingPdf(false);
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

      {/* 5. MODAL E-STATEMENT GENERATOR (BOTTOM SIDE / BOTTOM SHEET) */}
      <AnimatePresence>
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatementModalOpen(false)}
              className="fixed inset-0"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-5 max-h-[88vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#005E6A] dark:text-teal-300 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Cetak e-Statement / Rekening Koran
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Laporan rekening koran perbankan resmi ala Warung Tomi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsStatementModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Period Configuration Dropdown */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Pilih Periode / Bulan e-Statement:</span>
                  <span className="text-[10px] text-[#005E6A] dark:text-teal-400 font-bold">
                    {statementData.totalCount} Mutasi Tercatat
                  </span>
                </label>

                <div className="relative">
                  <select
                    value={statementPeriod}
                    onChange={(e) => setStatementPeriod(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A] appearance-none cursor-pointer"
                  >
                    <optgroup label="─── Pilihan Berdasarkan Bulan ───">
                      {availableMonths.map((m) => (
                        <option key={m.key} value={`month:${m.key}`}>
                          {m.label} {m.count > 0 ? `(${m.count} transaksi)` : ""}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="─── Pilihan Cepat Lainnya ───">
                      <option value="all">Semua Riwayat Transaksi (Dari Awal)</option>
                      <option value="3months">3 Bulan Terakhir</option>
                      <option value="custom">Kustom Rentang Tanggal...</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {statementPeriod === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-3 pt-2"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Dari Tanggal</label>
                      <input
                        type="date"
                        value={statementCustomStart}
                        onChange={(e) => setStatementCustomStart(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={statementCustomEnd}
                        onChange={(e) => setStatementCustomEnd(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Statement Live Preview Box (Authentic Warung Tomi Banking Card) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 space-y-4 font-sans">
                {/* Official Bank Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#005E6A] dark:text-teal-400 tracking-tight">
                      <Building2 className="w-4 h-4" /> WARUNG TOMI DIGITAL BANKING
                    </div>
                    <p className="text-[9px] text-slate-400">Unit Simpan Pinjam & Ritel Komunitas Terpercaya</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      e-Statement
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{statementData.periodLabel}</p>
                  </div>
                </div>

                {/* Customer Snapshot */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Nama Nasabah</span>
                    <span className="font-black text-slate-800 dark:text-white">{custName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">No. Rekening / ID</span>
                    <span className="font-black text-[#005E6A] dark:text-teal-400">{custId}</span>
                  </div>
                </div>

                {/* Summary Figures */}
                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 text-center">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Saldo Awal</p>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Rp {statementData.saldoAwal.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="border-x border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Total Setoran</p>
                    <p className="text-xs font-black text-emerald-600">
                      +Rp {statementData.periodSetor.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Saldo Akhir</p>
                    <p className="text-xs font-black text-[#005E6A] dark:text-teal-400">
                      Rp {statementData.saldoAkhir.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <p className="text-[9px] text-center text-slate-400 font-medium">
                  {statementData.totalCount} mutasi tercatat pada periode ini.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdf}
                  className="px-4 py-3 bg-[#005E6A] hover:bg-[#004852] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh PDF Resmi"}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrintBrowser}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Browser</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareWhatsApp}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan WA</span>
                </motion.button>
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
