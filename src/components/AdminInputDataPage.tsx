import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plus,
  ShoppingBag,
  Wallet,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  X,
  Sparkles,
  Save,
  AlertCircle
} from "lucide-react";
import {
  SupabaseSalesService,
  SupabaseSalesTransaction,
  SupabaseCustomerService,
  SupabaseSavingsService,
  SupabaseSavingTransaction,
  SupabaseDebtService,
  SupabaseDebtTransaction,
  SupabaseInvestmentService,
  SupabaseInvestmentTransaction,
  formatDateDDMMYYYY
} from "../lib/supabase";
import {
  JENIS_OPTIONS,
  MELALUI_OPTIONS,
  STATUS_OPTIONS,
  formatDateForInput,
  formatInputToDate
} from "./AdminDatabasePage";
import {
  generateNextTabunganId,
  generateNextHutangId,
  get4DigitCustId
} from "../App";
import { DatabaseSuccessModal, SuccessModalData } from "./DatabaseSuccessModal";

export interface AdminInputDataPageProps {
  salesTransactions: SalesTransaction[];
  setSalesTransactions: React.Dispatch<React.SetStateAction<SalesTransaction[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  savingsTransactions: any[];
  setSavingsTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  debtTransactions: any[];
  setDebtTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  investmentTransactions?: any[];
  setInvestmentTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
}

interface SalesTransaction {
  id: string;
  id_transaksi?: string;
  id_pelanggan?: string;
  Tanggal?: string;
  tanggal?: string;
  Nama?: string;
  nama?: string;
  Jenis?: string;
  Melalui?: string;
  Metode?: string;
  Pemasukan?: number;
  pemasukan?: number;
  hargaAdmin?: number;
  HargaModal?: number;
  Sebagian?: number;
  Poin?: number;
  Status?: string;
}

export const AdminInputDataPage: React.FC<AdminInputDataPageProps> = ({
  salesTransactions,
  setSalesTransactions,
  customers,
  setCustomers,
  savingsTransactions,
  setSavingsTransactions,
  debtTransactions,
  setDebtTransactions,
  investmentTransactions = [],
  setInvestmentTransactions
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'penjualan' | 'tabungan' | 'investasi' | 'hutang'
  const tabParam = searchParams.get("tab")?.toLowerCase() || "penjualan";
  const [activeTab, setActiveTab] = useState<"penjualan" | "tabungan" | "investasi" | "hutang">(
    ["penjualan", "tabungan", "investasi", "hutang"].includes(tabParam)
      ? (tabParam as any)
      : "penjualan"
  );

  useEffect(() => {
    if (["penjualan", "tabungan", "investasi", "hutang"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "penjualan" | "tabungan" | "investasi" | "hutang") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Toast & Processing Modal State
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [successModalData, setSuccessModalData] = useState<SuccessModalData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [processingTitle, setProcessingTitle] = useState("");
  const [processingMsg, setProcessingMsg] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const startProcessing = (title: string, message?: string) => {
    setProcessingTitle(title);
    setProcessingMsg(message || "Sedang memproses & menyimpan data ke Supabase Database...");
    setIsProcessingModal(true);
    setIsSuccessModalOpen(true);
  };

  const finishProcessingSuccess = (title: string, subtitle?: string, detail?: string) => {
    setProcessingTitle(title);
    setProcessingMsg(subtitle || "Data sukses tersimpan ke Database!");
    setSuccessModalData({
      title,
      subtitle: subtitle || "Data Berhasil Disimpan",
      detailInfo: detail || "Perubahan telah langsung tersinkron ke Supabase Database."
    });
    setIsProcessingModal(false);
    setIsSuccessModalOpen(true);
  };

  // ==========================================
  // 1. FORM PENJUALAN VIRTUAL
  // ==========================================
  const calculateAutoTxId = (idPelanggan: string, nama: string, allTxs: SalesTransaction[]): string => {
    const custDigits = get4DigitCustId(idPelanggan);
    const existingIds = new Set((allTxs || []).map((t) => String(t.id_transaksi || t.id || "")));

    const custTxs = (allTxs || []).filter((tx) => {
      const txCustId = (tx.id_pelanggan || "").trim().toLowerCase();
      const txName = (tx.Nama || tx.nama || "").trim().toLowerCase();
      const targetCustId = (idPelanggan || "").trim().toLowerCase();
      const targetName = (nama || "").trim().toLowerCase();

      if (targetCustId && targetCustId !== "cust-0000") {
        if (txCustId === targetCustId) return true;
      }
      if (targetName && targetName.toLowerCase() !== "pelanggan umum") {
        if (txName === targetName) return true;
      }
      return false;
    });

    let maxSeq = custTxs.length;
    custTxs.forEach((tx) => {
      const txIdStr = tx.id_transaksi || tx.id || "";
      const match = txIdStr.match(/\/(\d+)(?:-\d+)?$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    let nextSeq = maxSeq + 1;
    let candidate = `TRX-${custDigits}/${nextSeq}`;

    while (existingIds.has(candidate)) {
      nextSeq++;
      candidate = `TRX-${custDigits}/${nextSeq}`;
    }

    if (custDigits === "0000" || !idPelanggan || idPelanggan === "CUST-0000") {
      const timeSlice = Math.floor(Date.now() / 1000).toString().slice(-4);
      candidate = `TRX-${custDigits}/${nextSeq}-${timeSlice}`;
      while (existingIds.has(candidate)) {
        candidate = `TRX-${custDigits}/${nextSeq}-${Math.floor(Math.random() * 9000 + 1000)}`;
      }
    }

    return candidate;
  };

  const defaultCustId = "CUST-0000";
  const defaultName = "Pelanggan Umum";
  const initialTxId = calculateAutoTxId(defaultCustId, defaultName, salesTransactions);

  const [addSalesForm, setAddSalesForm] = useState<Partial<SalesTransaction>>({
    id_transaksi: initialTxId,
    id_pelanggan: defaultCustId,
    Tanggal: formatDateDDMMYYYY(),
    Nama: defaultName,
    Jenis: "TARIK TUNAI",
    Melalui: "EDC BNI",
    Metode: "TUNAI",
    Pemasukan: 0,
    hargaAdmin: 3000,
    HargaModal: 0,
    Sebagian: 0,
    Poin: 0,
    Status: "SELESAI"
  });
  const [isSavingSales, setIsSavingSales] = useState(false);

  const calculateWarungTomiFee = (amount: number) => {
    if (amount <= 0) return 0;
    if (amount <= 103000) return 3000;
    if (amount <= 999999) return 5000;
    if (amount <= 1999999) return 10000;
    if (amount <= 2999999) return 15000;
    if (amount <= 3999999) return 20000;
    if (amount <= 4999999) return 25000;
    return Math.round(amount * 0.005);
  };

  const handleSalesPemasukanChange = (val: number, customMelalui?: string) => {
    const adminFee = calculateWarungTomiFee(val);
    const channel = customMelalui !== undefined ? customMelalui : (addSalesForm.Melalui || "EDC BNI");
    const edcExtra = channel === "EDC BNI" ? 1500 : 0;
    const modalVal = Math.max(0, val - adminFee - edcExtra);
    const autoPoin = Math.floor(val / 10000);

    setAddSalesForm((prev) => ({
      ...prev,
      Pemasukan: val,
      HargaModal: modalVal,
      hargaAdmin: adminFee,
      Poin: autoPoin
    }));
  };

  const handleSalesHargaModalChange = (modalVal: number) => {
    const jual = addSalesForm.Pemasukan || 0;
    const edcExtra = (addSalesForm.Melalui || "EDC BNI") === "EDC BNI" ? 1500 : 0;
    const adminFee = Math.max(0, jual - modalVal - edcExtra);
    setAddSalesForm((prev) => ({
      ...prev,
      HargaModal: modalVal,
      hargaAdmin: adminFee
    }));
  };

  const handleSaveSales = async () => {
    if (!addSalesForm.Nama || !addSalesForm.Nama.trim()) {
      showToast("Nama Pelanggan wajib diisi.", "error");
      return;
    }
    setIsSavingSales(true);

    const now = new Date();
    const nowIso = now.toISOString();

    const newTx: SalesTransaction = {
      id: addSalesForm.id_transaksi || `TRX-${Date.now()}`,
      id_transaksi: addSalesForm.id_transaksi || `TRX-${Date.now()}`,
      id_pelanggan: addSalesForm.id_pelanggan || "CUST-0000",
      Tanggal: addSalesForm.Tanggal || formatDateDDMMYYYY(),
      Nama: addSalesForm.Nama.trim(),
      Jenis: addSalesForm.Jenis || "TARIK TUNAI",
      Melalui: addSalesForm.Melalui || "EDC BNI",
      Metode: addSalesForm.Metode || "TUNAI",
      Pemasukan: Number(addSalesForm.Pemasukan) || 0,
      hargaAdmin: Number(addSalesForm.hargaAdmin) || 0,
      HargaModal: Number(addSalesForm.HargaModal) || 0,
      Sebagian: Number(addSalesForm.Sebagian) || 0,
      Poin: Number(addSalesForm.Poin) || 0,
      Status: addSalesForm.Status || "SELESAI",
      created_at: nowIso
    };

    startProcessing(
      "MENYIMPAN PENJUALAN VIRTUAL...",
      `Sedang mengirim data ${newTx.id_transaksi} ke Supabase Database...`
    );

    setSalesTransactions((prev) => [newTx, ...prev]);

    try {
      if (SupabaseSalesService.isConnected()) {
        const payload: SupabaseSalesTransaction = {
          id: newTx.id,
          id_transaksi: newTx.id_transaksi || newTx.id,
          id_pelanggan: newTx.id_pelanggan,
          tanggal: newTx.Tanggal || formatDateDDMMYYYY(),
          nama: newTx.Nama,
          jenis: newTx.Jenis,
          melalui: newTx.Melalui,
          metode: newTx.Metode,
          pemasukan: newTx.Pemasukan,
          harga_admin: newTx.hargaAdmin,
          harga_modal: newTx.HargaModal,
          sebagian: newTx.Sebagian,
          created_at: nowIso
        };
        await SupabaseSalesService.upsertSale(payload);
      }

      finishProcessingSuccess(
        "PENJUALAN VIRTUAL BERHASIL DISIMPAN",
        `Transaksi ${newTx.id_transaksi} atas nama ${newTx.Nama} telah sukses tersimpan di Supabase Database!`,
        `Jenis: ${newTx.Jenis} | Total: Rp ${(newTx.Pemasukan || 0).toLocaleString('id-ID')}`
      );

      // Reset form with a brand new auto transaction ID
      const nextTxId = calculateAutoTxId(defaultCustId, defaultName, [newTx, ...salesTransactions]);
      setAddSalesForm({
        id_transaksi: nextTxId,
        id_pelanggan: defaultCustId,
        Tanggal: formatDateDDMMYYYY(),
        Nama: defaultName,
        Jenis: "TARIK TUNAI",
        Melalui: "EDC BNI",
        Metode: "TUNAI",
        Pemasukan: 0,
        hargaAdmin: 3000,
        HargaModal: 0,
        Sebagian: 0,
        Poin: 0,
        Status: "SELESAI"
      });
    } catch (err: any) {
      console.error("Gagal menambah transaksi virtual:", err);
      setIsProcessingModal(false);
      setIsSuccessModalOpen(false);
      showToast("Gagal menyimpan data ke database.", "error");
    } finally {
      setIsSavingSales(false);
    }
  };

  // ==========================================
  // 2. FORM TABUNGAN
  // ==========================================
  const todayIso = new Date().toISOString().slice(0, 10);
  const [addSavingForm, setAddSavingForm] = useState<Partial<SupabaseSavingTransaction>>({
    tanggal: todayIso,
    nama_nasabah: "",
    tipe: "SETOR",
    nominal: 0,
    saldo_akhir: 0,
    keterangan: "-"
  });
  const [isSavingTabungan, setIsSavingTabungan] = useState(false);

  const handleSavingCustomerChange = (custName: string) => {
    const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
    const custId = found ? (found.id_pelanggan || found.id || "") : "";
    const currentTab = found ? (typeof found.Tabungan === 'number' ? found.Tabungan : parseFloat(String(found.Tabungan || 0))) : 0;
    const nominal = Number(addSavingForm.nominal) || 0;
    const isSetor = (addSavingForm.tipe || "SETOR") === "SETOR";
    const newSaldo = isSetor ? currentTab + nominal : Math.max(0, currentTab - nominal);

    setAddSavingForm((prev) => ({
      ...prev,
      nama_nasabah: custName,
      nama: custName,
      id_pelanggan: custId,
      saldo_akhir: newSaldo
    }));
  };

  const handleSavingNominalChange = (nominal: number) => {
    const custName = addSavingForm.nama_nasabah || "";
    const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
    const currentTab = found ? (typeof found.Tabungan === 'number' ? found.Tabungan : parseFloat(String(found.Tabungan || 0))) : 0;
    const isSetor = (addSavingForm.tipe || "SETOR") === "SETOR";
    const newSaldo = isSetor ? currentTab + nominal : Math.max(0, currentTab - nominal);

    setAddSavingForm((prev) => ({
      ...prev,
      nominal,
      saldo_akhir: newSaldo
    }));
  };

  const handleSaveTabungan = async () => {
    const nameVal = addSavingForm.nama_nasabah || addSavingForm.nama || "";
    if (!nameVal.trim()) {
      showToast("Nama Nasabah harus diisi!", "error");
      return;
    }
    setIsSavingTabungan(true);

    const newSaving: SupabaseSavingTransaction = {
      id: addSavingForm.id || `SAV-${Date.now()}`,
      id_tabungan: addSavingForm.id_tabungan || addSavingForm.id || `TBG-${Date.now()}`,
      id_pelanggan: addSavingForm.id_pelanggan || "",
      tanggal: formatDateDDMMYYYY(addSavingForm.tanggal),
      nama: nameVal,
      nama_nasabah: nameVal,
      tipe: (addSavingForm.tipe as "SETOR" | "TARIK") || "SETOR",
      nominal: Number(addSavingForm.nominal) || 0,
      saldo_akhir: Number(addSavingForm.saldo_akhir) || Number(addSavingForm.nominal) || 0,
      keterangan: addSavingForm.keterangan || "-"
    };

    startProcessing(
      "MENYIMPAN TRANSAKSI TABUNGAN...",
      `Sedang mengirim data ${newSaving.tipe === "TARIK" ? "tarik" : "setor"} tabungan ke Supabase Database...`
    );

    if (setSavingsTransactions) {
      setSavingsTransactions((prev: any) => [
        {
          id: newSaving.id_tabungan || newSaving.id,
          id_tabungan: newSaving.id_tabungan,
          id_pelanggan: newSaving.id_pelanggan || '',
          Tanggal: newSaving.tanggal,
          Nama: newSaving.nama_nasabah || newSaving.nama,
          Tipe: newSaving.tipe,
          Nominal: newSaving.nominal,
          SaldoAkhir: newSaving.saldo_akhir,
          Berita: newSaving.keterangan || '-'
        },
        ...prev
      ]);
    }

    if (setCustomers) {
      setCustomers((prev: any[]) => prev.map((c: any) => 
        (c.id_pelanggan && c.id_pelanggan === newSaving.id_pelanggan) || (c.nama || c.Nama) === newSaving.nama_nasabah
          ? { ...c, Tabungan: newSaving.saldo_akhir, tabungan: newSaving.saldo_akhir }
          : c
      ));
    }

    try {
      if (SupabaseSavingsService.isConnected()) {
        await SupabaseSavingsService.upsertSaving(newSaving);
        if (SupabaseCustomerService.isConnected()) {
          await SupabaseCustomerService.upsertCustomer({
            id_pelanggan: newSaving.id_pelanggan || newSaving.nama_nasabah,
            nama: newSaving.nama_nasabah,
            tabungan: newSaving.saldo_akhir
          });
        }
      }

      finishProcessingSuccess(
        "TABUNGAN BERHASIL DISIMPAN",
        `Transaksi tabungan atas nama ${newSaving.nama_nasabah} telah sukses tersimpan di Supabase Database!`,
        `Tipe: ${newSaving.tipe} | Nominal: Rp ${(newSaving.nominal || 0).toLocaleString('id-ID')} | Saldo: Rp ${(newSaving.saldo_akhir || 0).toLocaleString('id-ID')}`
      );
    } catch (err: any) {
      console.error("Gagal menyimpan tabungan:", err);
      setIsProcessingModal(false);
      setIsSuccessModalOpen(false);
      showToast("Gagal menyimpan tabungan ke database.", "error");
    } finally {
      setIsSavingTabungan(false);
    }
  };

  // ==========================================
  // 3. FORM INVESTASI
  // ==========================================
  const calculateAutoInvId = (custName: string, idPelanggan: string) => {
    if (!custName) return "INV-0000/1";
    const cleanId = idPelanggan ? idPelanggan.replace(/\D/g, '') : '';
    const last4 = cleanId.length >= 4 ? cleanId.slice(-4) : (idPelanggan ? idPelanggan.slice(-4) : '0000');
    
    const existingCount = (investmentTransactions || []).filter((inv: any) => {
      const invName = inv.nama || inv.nama_investor || '';
      const invCustId = inv.id_pelanggan || '';
      return (idPelanggan && invCustId === idPelanggan) || (custName && invName.toLowerCase() === custName.toLowerCase());
    }).length;

    return `INV-${last4}/${existingCount + 1}`;
  };

  const computeJatuhTempoIso = (startDateIso: string, tenorMonths: number) => {
    if (!startDateIso) return "";
    const [y, m, d] = startDateIso.split("-").map(Number);
    if (!y || !m || !d) return "";
    const dt = new Date(y, m - 1, d);
    dt.setMonth(dt.getMonth() + tenorMonths);
    const resY = dt.getFullYear();
    const resM = String(dt.getMonth() + 1).padStart(2, "0");
    const resD = String(dt.getDate()).padStart(2, "0");
    return `${resY}-${resM}-${resD}`;
  };

  const [addInvestmentForm, setAddInvestmentForm] = useState<Partial<SupabaseInvestmentTransaction> & { metode?: "TUNAI" | "TABUNGAN" }>({
    tanggal: todayIso,
    jatuh_tempo: computeJatuhTempoIso(todayIso, 12),
    id_investasi: "INV-0000/1",
    id_pelanggan: "",
    nama_investor: "",
    nama: "",
    tenor_bulan: 12,
    tenor: "12 Bulan",
    nisbah_persen: 10,
    nisbah: "10%",
    nominal: 0,
    status: "AKTIF",
    metode: "TUNAI",
    keterangan: "-"
  });
  const [isSavingInvestasi, setIsSavingInvestasi] = useState(false);

  const handleInvestmentCustomerChange = (val: string) => {
    const found = customers.find((c: any) => (c.nama || c.Nama) === val);
    const custId = found ? (found.id_pelanggan || found.id || "") : "";
    const autoInvId = calculateAutoInvId(val, custId);

    setAddInvestmentForm((prev) => ({
      ...prev,
      nama_investor: val,
      nama: val,
      id_pelanggan: custId,
      id_investasi: autoInvId,
      id: autoInvId
    }));
  };

  const handleSaveInvestasi = async () => {
    const nameVal = addInvestmentForm.nama_investor || addInvestmentForm.nama || "";
    if (!nameVal.trim()) {
      showToast("Nama Investor / Pelanggan harus diisi!", "error");
      return;
    }
    const nom = Number(addInvestmentForm.nominal) || 0;
    if (nom <= 0) {
      showToast("Nominal investasi harus lebih dari 0!", "error");
      return;
    }

    setIsSavingInvestasi(true);

    const custId = addInvestmentForm.id_pelanggan || "";
    const autoInvId = addInvestmentForm.id_investasi || calculateAutoInvId(nameVal, custId);
    const tenorMonths = Number(addInvestmentForm.tenor_bulan) || 12;
    const nisbahPct = addInvestmentForm.nisbah_persen ?? ((tenorMonths / 12) * 10);
    const metode = addInvestmentForm.metode || "TUNAI";

    // Deduct from savings if method is TABUNGAN
    if (metode === "TABUNGAN") {
      const found = customers.find((c: any) => (c.nama || c.Nama) === nameVal || (c.id_pelanggan && c.id_pelanggan === custId));
      const currentTab = found ? (typeof found.Tabungan === 'number' ? found.Tabungan : parseFloat(String(found.Tabungan || 0))) : 0;
      if (currentTab < nom) {
        showToast(`Saldo tabungan ${nameVal} (Rp ${currentTab.toLocaleString('id-ID')}) tidak mencukupi untuk investasi Rp ${nom.toLocaleString('id-ID')}!`, "error");
        setIsSavingInvestasi(false);
        return;
      }

      const newSaldo = currentTab - nom;

      const newSaving: SupabaseSavingTransaction = {
        id: `SAV-${Date.now()}`,
        id_tabungan: `TBG-${Date.now()}`,
        id_pelanggan: custId,
        tanggal: formatDateDDMMYYYY(addInvestmentForm.tanggal),
        nama: nameVal,
        nama_nasabah: nameVal,
        tipe: "TARIK",
        nominal: nom,
        saldo_akhir: newSaldo,
        keterangan: `Penarikan Tabungan untuk Investasi (${autoInvId})`
      };

      if (setSavingsTransactions) {
        setSavingsTransactions((prev: any) => [
          {
            id: newSaving.id_tabungan,
            id_tabungan: newSaving.id_tabungan,
            id_pelanggan: newSaving.id_pelanggan,
            Tanggal: newSaving.tanggal,
            Nama: nameVal,
            Tipe: "TARIK",
            Nominal: nom,
            SaldoAkhir: newSaldo,
            Berita: newSaving.keterangan
          },
          ...prev
        ]);
      }

      if (setCustomers) {
        setCustomers((prev: any[]) => prev.map((c: any) => 
          (c.id_pelanggan && c.id_pelanggan === custId) || (c.nama || c.Nama) === nameVal
            ? { ...c, Tabungan: newSaldo, tabungan: newSaldo }
            : c
        ));
      }

      try {
        if (SupabaseSavingsService.isConnected()) {
          await SupabaseSavingsService.upsertSaving(newSaving);
          if (SupabaseCustomerService.isConnected()) {
            await SupabaseCustomerService.upsertCustomer({
              id_pelanggan: custId || nameVal,
              nama: nameVal,
              tabungan: newSaldo
            });
          }
        }
      } catch (e) {
        console.error("Gagal potong tabungan:", e);
      }
    }

    const rawJatuhTempoIso = addInvestmentForm.jatuh_tempo || computeJatuhTempoIso(addInvestmentForm.tanggal || todayIso, tenorMonths);
    const formattedJatuhTempo = formatDateDDMMYYYY(rawJatuhTempoIso);

    const newInv: any = {
      id: autoInvId,
      id_investasi: autoInvId,
      id_pelanggan: custId,
      tanggal: formatDateDDMMYYYY(addInvestmentForm.tanggal),
      Tanggal: formatDateDDMMYYYY(addInvestmentForm.tanggal),
      nama: nameVal,
      nama_investor: nameVal,
      Nama: nameVal,
      nominal: nom,
      Nominal: nom,
      tenor_bulan: tenorMonths,
      tenor: addInvestmentForm.tenor || `${tenorMonths} Bulan`,
      Tenor: addInvestmentForm.tenor || `${tenorMonths} Bulan`,
      jatuh_tempo: formattedJatuhTempo,
      JatuhTempo: formattedJatuhTempo,
      nisbah_persen: nisbahPct,
      nisbah: `${nisbahPct}%`,
      Nisbah: `${nisbahPct}%`,
      status: (addInvestmentForm.status as string) || "AKTIF",
      Status: (addInvestmentForm.status as string) || "AKTIF",
      keterangan: addInvestmentForm.keterangan || (metode === "TABUNGAN" ? "Pembayaran via Tabungan" : "Tunai"),
      Keterangan: addInvestmentForm.keterangan || (metode === "TABUNGAN" ? "Pembayaran via Tabungan" : "Tunai")
    };

    startProcessing(
      "MENYIMPAN INVESTASI...",
      `Sedang mengirim data investasi atas nama ${newInv.nama_investor} ke Supabase Database...`
    );

    if (setInvestmentTransactions) {
      setInvestmentTransactions((prev: any[]) => [newInv, ...prev]);
    }

    try {
      if (SupabaseInvestmentService.isConnected()) {
        const { error } = await SupabaseInvestmentService.upsertInvestment(newInv);
        if (error) {
          console.error("Gagal menyimpan investasi ke Supabase:", error);
          showToast(`Peringatan Supabase: ${error.message || error}`, "error");
        }
      }

      finishProcessingSuccess(
        "INVESTASI BERHASIL DISIMPAN",
        `Data investasi atas nama ${newInv.nama_investor} telah sukses tersimpan di Supabase Database!`,
        `Metode: ${metode} | Nominal: Rp ${nom.toLocaleString('id-ID')} | Tenor: ${newInv.tenor} | Tempo: ${formattedJatuhTempo}`
      );
    } catch (err: any) {
      console.error("Gagal menyimpan investasi:", err);
      setIsProcessingModal(false);
      setIsSuccessModalOpen(false);
      showToast("Gagal menyimpan investasi ke database.", "error");
    } finally {
      setIsSavingInvestasi(false);
    }
  };

  // ==========================================
  // 4. FORM HUTANG
  // ==========================================
  const [addDebtForm, setAddDebtForm] = useState<Partial<SupabaseDebtTransaction>>({
    tanggal: todayIso,
    nama_pelanggan: "",
    tipe: "KASBON",
    jumlah: 0,
    saldo_akhir: 0,
    keterangan: "-"
  });
  const [isSavingHutang, setIsSavingHutang] = useState(false);

  const handleDebtCustomerChange = (custName: string) => {
    const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
    const custId = found ? (found.id_pelanggan || found.id || "") : "";
    const currentHutang = found ? (typeof found.Hutang === 'number' ? found.Hutang : parseFloat(String(found.Hutang || 0))) : 0;
    const jumlah = Number(addDebtForm.jumlah) || 0;
    const isKasbon = (addDebtForm.tipe || "KASBON") === "KASBON";
    const newSaldo = isKasbon ? currentHutang + jumlah : Math.max(0, currentHutang - jumlah);

    setAddDebtForm((prev) => ({
      ...prev,
      nama_pelanggan: custName,
      nama: custName,
      id_pelanggan: custId,
      saldo_akhir: newSaldo
    }));
  };

  const handleDebtJumlahChange = (jumlah: number) => {
    const custName = addDebtForm.nama_pelanggan || "";
    const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
    const currentHutang = found ? (typeof found.Hutang === 'number' ? found.Hutang : parseFloat(String(found.Hutang || 0))) : 0;
    const isKasbon = (addDebtForm.tipe || "KASBON") === "KASBON";
    const newSaldo = isKasbon ? currentHutang + jumlah : Math.max(0, currentHutang - jumlah);

    setAddDebtForm((prev) => ({
      ...prev,
      jumlah,
      saldo_akhir: newSaldo
    }));
  };

  const handleSaveHutang = async () => {
    const nameVal = addDebtForm.nama_pelanggan || addDebtForm.nama || "";
    if (!nameVal.trim()) {
      showToast("Nama Pelanggan harus diisi!", "error");
      return;
    }
    setIsSavingHutang(true);

    const newDebt: SupabaseDebtTransaction = {
      id: addDebtForm.id || `DEBT-${Date.now()}`,
      id_hutang: addDebtForm.id_hutang || addDebtForm.id || `HTG-${Date.now()}`,
      id_pelanggan: addDebtForm.id_pelanggan || "",
      tanggal: formatDateDDMMYYYY(addDebtForm.tanggal),
      nama: nameVal,
      nama_pelanggan: nameVal,
      tipe: (addDebtForm.tipe as "KASBON" | "BAYAR") || "KASBON",
      jumlah: Number(addDebtForm.jumlah) || 0,
      saldo_akhir: Number(addDebtForm.saldo_akhir) || Number(addDebtForm.jumlah) || 0,
      keterangan: addDebtForm.keterangan || "-"
    };

    startProcessing(
      "MENYIMPAN DATA HUTANG...",
      `Sedang mengirim data ${newDebt.tipe === "BAYAR" ? "pembayaran hutang" : "kasbon"} ke Supabase Database...`
    );

    if (setDebtTransactions) {
      setDebtTransactions((prev: any) => [
        {
          id: newDebt.id_hutang || newDebt.id,
          id_hutang: newDebt.id_hutang,
          id_pelanggan: newDebt.id_pelanggan || '',
          Tanggal: newDebt.tanggal,
          Nama: newDebt.nama_pelanggan || newDebt.nama,
          Tipe: newDebt.tipe,
          Jumlah: newDebt.jumlah,
          Keterangan: newDebt.keterangan || '-',
          SaldoAkhir: newDebt.saldo_akhir
        },
        ...prev
      ]);
    }

    if (setCustomers) {
      setCustomers((prev: any[]) => prev.map((c: any) => 
        (c.id_pelanggan && c.id_pelanggan === newDebt.id_pelanggan) || (c.nama || c.Nama) === newDebt.nama_pelanggan
          ? { ...c, Hutang: newDebt.saldo_akhir, hutang: newDebt.saldo_akhir }
          : c
      ));
    }

    try {
      if (SupabaseDebtService.isConnected()) {
        await SupabaseDebtService.upsertDebt(newDebt);
        if (SupabaseCustomerService.isConnected()) {
          await SupabaseCustomerService.upsertCustomer({
            id_pelanggan: newDebt.id_pelanggan || newDebt.nama_pelanggan,
            nama: newDebt.nama_pelanggan,
            hutang: newDebt.saldo_akhir
          });
        }
      }

      finishProcessingSuccess(
        "HUTANG BERHASIL DISIMPAN",
        `Data hutang atas nama ${newDebt.nama_pelanggan} telah sukses tersimpan di Supabase Database!`,
        `Tipe: ${newDebt.tipe} | Jumlah: Rp ${(newDebt.jumlah || 0).toLocaleString('id-ID')} | Saldo Akhir: Rp ${(newDebt.saldo_akhir || 0).toLocaleString('id-ID')}`
      );
    } catch (err: any) {
      console.error("Gagal menyimpan hutang:", err);
      setIsProcessingModal(false);
      setIsSuccessModalOpen(false);
      showToast("Gagal menyimpan hutang ke database.", "error");
    } finally {
      setIsSavingHutang(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16 pt-4 px-3 sm:px-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-none shadow-2xl border-l-4 border-[#005E6A] animate-bounce">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Database Processing / Success Animation Modal */}
      <DatabaseSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          // Auto navigate back to database page upon user closing modal
          navigate("/admin/database");
        }}
        isProcessing={isProcessingModal}
        processingTitle={processingTitle}
        processingMessage={processingMsg}
        data={successModalData}
      />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/database")}
              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-[#005E6A] hover:text-white text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Kembali ke Database"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 text-[10px] font-black uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Input Data
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/database")}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
          >
            Batal & Kembali
          </button>
        </div>

        {/* Tab Navigation Controls (penjualan, tabungan, Investasi, hutang) */}
        <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => handleTabChange("penjualan")}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "penjualan"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>penjualan</span>
            </button>

            <button
              onClick={() => handleTabChange("tabungan")}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "tabungan"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>tabungan</span>
            </button>

            <button
              onClick={() => handleTabChange("investasi")}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "investasi"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Investasi</span>
            </button>

            <button
              onClick={() => handleTabChange("hutang")}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "hutang"
                  ? "bg-[#005E6A] text-white shadow-md"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>hutang</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* TAB 1: PENJUALAN */}
          {activeTab === "penjualan" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#005E6A]" />
                    <span>Tambah Data Penjualan</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Input data transaksi penjualan virtual baru yang langsung tersinkron ke Supabase Database.
                  </p>
                </div>
                <div className="px-3 py-1 bg-[#005E6A]/10 text-[#005E6A] dark:text-teal-300 text-xs font-mono font-bold">
                  {addSalesForm.id_transaksi}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* ID Transaksi & Tanggal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    ID Transaksi (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={addSalesForm.id_transaksi || ""}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tanggal (Kalender)
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(addSalesForm.Tanggal)}
                    onChange={(e) =>
                      setAddSalesForm({
                        ...addSalesForm,
                        Tanggal: formatInputToDate(e.target.value)
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                {/* ID Pelanggan & Nama Pelanggan */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    ID Pelanggan (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={addSalesForm.id_pelanggan || "CUST-0000"}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nama Pelanggan *
                  </label>
                  <select
                    value={addSalesForm.Nama || "Pelanggan Umum"}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      let selectedId = "CUST-0000";
                      if (selectedName !== "Pelanggan Umum") {
                        const found = customers.find(
                          (c) => (c.nama || c.Nama) === selectedName
                        );
                        if (found) {
                          selectedId = found.id_pelanggan || found.id || "CUST-0000";
                        }
                      }
                      const newTxId = calculateAutoTxId(selectedId, selectedName, salesTransactions);
                      setAddSalesForm((prev) => ({
                        ...prev,
                        Nama: selectedName,
                        id_pelanggan: selectedId,
                        id_transaksi: newTxId
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="Pelanggan Umum">Pelanggan Umum</option>
                    {customers
                      .filter((c) => (c.nama || c.Nama) && (c.nama || c.Nama) !== "Pelanggan Umum")
                      .map((c, idx) => {
                        const cName = c.nama || c.Nama;
                        const cId = c.id_pelanggan || c.id || `CUST-${String(idx + 1).padStart(4, "0")}`;
                        return (
                          <option key={`sales_cust_${cId}_${idx}`} value={cName}>
                            {cName}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Jenis & Melalui */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={addSalesForm.Jenis || "TARIK TUNAI"}
                    onChange={(e) => setAddSalesForm({ ...addSalesForm, Jenis: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    {JENIS_OPTIONS.map((opt) => (
                      <option key={`jenis_${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Melalui / Channel
                  </label>
                  <select
                    value={addSalesForm.Melalui || "EDC BNI"}
                    onChange={(e) => {
                      const newMelalui = e.target.value;
                      const jual = addSalesForm.Pemasukan || 0;
                      const adminFee = addSalesForm.hargaAdmin !== undefined ? addSalesForm.hargaAdmin : calculateWarungTomiFee(jual);
                      const edcExtra = newMelalui === "EDC BNI" ? 1500 : 0;
                      const calculatedModal = Math.max(0, jual - adminFee - edcExtra);
                      setAddSalesForm((prev) => ({
                        ...prev,
                        Melalui: newMelalui,
                        HargaModal: calculatedModal
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    {MELALUI_OPTIONS.map((opt) => (
                      <option key={`melalui_${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metode & Status */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={addSalesForm.Metode || "TUNAI"}
                    onChange={(e) => setAddSalesForm({ ...addSalesForm, Metode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="TUNAI">TUNAI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="KASBON">KASBON</option>
                    <option value="TABUNGAN">TABUNGAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Status Transaksi
                  </label>
                  <select
                    value={addSalesForm.Status || "SELESAI"}
                    onChange={(e) => setAddSalesForm({ ...addSalesForm, Status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={`status_${st}`} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal Jual & Harga Modal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nominal Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={addSalesForm.Pemasukan || ""}
                    onChange={(e) => handleSalesPemasukanChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Harga Modal (RP)*
                  </label>
                  <input
                    type="number"
                    placeholder="97000"
                    value={addSalesForm.HargaModal || ""}
                    onChange={(e) => handleSalesHargaModalChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 text-xs font-black text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                {/* Sebagian & Poin */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Sebagian / DP (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={addSalesForm.Sebagian || ""}
                    onChange={(e) => setAddSalesForm({ ...addSalesForm, Sebagian: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Poin Reward (Otomatis)
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={addSalesForm.Poin ?? 0}
                    onChange={(e) => setAddSalesForm({ ...addSalesForm, Poin: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs font-black text-amber-800 dark:text-amber-300 focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/database")}
                  className="px-5 py-3 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer uppercase"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSales}
                  disabled={isSavingSales}
                  className="px-6 py-3 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSales ? "Menyimpan..." : "Simpan Transaksi Penjualan"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TABUNGAN */}
          {activeTab === "tabungan" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#005E6A]" />
                  <span>Tambah Data Tabungan</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catat transaksi Setor atau Tarik Tabungan nasabah/pelanggan secara langsung.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={addSavingForm.tanggal || ""}
                    onChange={(e) => setAddSavingForm({ ...addSavingForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nama Nasabah / Pelanggan *
                  </label>
                  <input
                    type="text"
                    list="customer-saving-list"
                    placeholder="Ketik atau pilih nama nasabah"
                    value={addSavingForm.nama_nasabah || ""}
                    onChange={(e) => handleSavingCustomerChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                  <datalist id="customer-saving-list">
                    {customers.map((c, i) => (
                      <option key={`c_sav_${i}`} value={c.nama || c.Nama} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tipe Transaksi
                  </label>
                  <select
                    value={addSavingForm.tipe || "SETOR"}
                    onChange={(e) => {
                      const newTipe = e.target.value as "SETOR" | "TARIK";
                      const custName = addSavingForm.nama_nasabah || "";
                      const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
                      const currentTab = found ? (typeof found.Tabungan === 'number' ? found.Tabungan : parseFloat(String(found.Tabungan || 0))) : 0;
                      const nom = Number(addSavingForm.nominal) || 0;
                      const newSaldo = newTipe === "SETOR" ? currentTab + nom : Math.max(0, currentTab - nom);

                      setAddSavingForm({ ...addSavingForm, tipe: newTipe, saldo_akhir: newSaldo });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="SETOR">SETOR (Tambah Tabungan)</option>
                    <option value="TARIK">TARIK (Penarikan Tabungan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={addSavingForm.nominal || ""}
                    onChange={(e) => handleSavingNominalChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Estimasi Saldo Akhir (Rp)
                  </label>
                  <input
                    type="number"
                    value={addSavingForm.saldo_akhir || 0}
                    onChange={(e) => setAddSavingForm({ ...addSavingForm, saldo_akhir: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 text-xs font-black text-[#005E6A] dark:text-teal-300 focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Berita / Catatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Setoran mingguan"
                    value={addSavingForm.keterangan || ""}
                    onChange={(e) => setAddSavingForm({ ...addSavingForm, keterangan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/database")}
                  className="px-5 py-3 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer uppercase"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTabungan}
                  disabled={isSavingTabungan}
                  className="px-6 py-3 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingTabungan ? "Menyimpan..." : "Simpan Data Tabungan"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: INVESTASI */}
          {activeTab === "investasi" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#005E6A]" />
                  <span>Tambah Data Investasi</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catat modal investasi baru dari investor dengan detail nisbah dan tenor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Tanggal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={addInvestmentForm.tanggal || ""}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const newJT = computeJatuhTempoIso(newDate, Number(addInvestmentForm.tenor_bulan || 12));
                      setAddInvestmentForm({ ...addInvestmentForm, tanggal: newDate, jatuh_tempo: newJT });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                {/* 2. Jatuh Tempo */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    value={addInvestmentForm.jatuh_tempo || computeJatuhTempoIso(addInvestmentForm.tanggal || todayIso, Number(addInvestmentForm.tenor_bulan || 12))}
                    onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, jatuh_tempo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                {/* 3. ID Investasi */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    ID Investasi (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={addInvestmentForm.id_investasi || "INV-0000/1"}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#005E6A] dark:text-teal-300 cursor-not-allowed"
                  />
                </div>

                {/* 4. ID Pelanggan */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    ID Pelanggan (Otomatis)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={addInvestmentForm.id_pelanggan || "-"}
                    placeholder="Pilih pelanggan dahulu"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                {/* 5. Nama Pelanggan */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nama Pelanggan / Investor *
                  </label>
                  <select
                    value={addInvestmentForm.nama_investor || ""}
                    onChange={(e) => handleInvestmentCustomerChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="">-- Pilih Investor / Pelanggan --</option>
                    {customers.map((c: any, idx: number) => {
                      const cName = c.nama || c.Nama || "";
                      return (
                        <option key={idx} value={cName}>
                          {cName} {c.telepon || c.no_hp ? `(${c.telepon || c.no_hp})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 6. Tenor */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tenor
                  </label>
                  <select
                    value={addInvestmentForm.tenor_bulan || 12}
                    onChange={(e) => {
                      const tBulan = Number(e.target.value);
                      const nisbahPct = (tBulan / 12) * 10;
                      const newJT = computeJatuhTempoIso(addInvestmentForm.tanggal || todayIso, tBulan);
                      setAddInvestmentForm({
                        ...addInvestmentForm,
                        tenor_bulan: tBulan,
                        tenor: `${tBulan} Bulan`,
                        nisbah_persen: nisbahPct,
                        nisbah: `${nisbahPct}%`,
                        jatuh_tempo: newJT
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={9}>9 Bulan</option>
                    <option value={12}>12 Bulan</option>
                  </select>
                </div>

                {/* 6. Keuntungan / Nisbah */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Keuntungan / Nisbah (%)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${addInvestmentForm.nisbah_persen ?? ((Number(addInvestmentForm.tenor_bulan || 12) / 12) * 10)}%`}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#005E6A] dark:text-teal-300 cursor-not-allowed"
                  />
                </div>

                {/* 7. Nominal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nominal Investasi (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="5000000"
                    value={addInvestmentForm.nominal || ""}
                    onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, nominal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                {/* 8. Perkiraan Keuntungan */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Perkiraan Keuntungan (Rp)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`Rp ${Math.round((Number(addInvestmentForm.nominal || 0) * (addInvestmentForm.nisbah_persen ?? ((Number(addInvestmentForm.tenor_bulan || 12) / 12) * 10))) / 100).toLocaleString('id-ID')}`}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-not-allowed"
                  />
                </div>

                {/* 9. Status */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Status Investasi
                  </label>
                  <select
                    value={addInvestmentForm.status || "AKTIF"}
                    onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="SUKSES DICAIRKAN">SUKSES DICAIRKAN</option>
                  </select>
                </div>

                {/* 10. Metode */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={addInvestmentForm.metode || "TUNAI"}
                    onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, metode: e.target.value as "TUNAI" | "TABUNGAN" })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="TUNAI">TUNAI</option>
                    <option value="TABUNGAN">TABUNGAN (Potong Otomatis Tabungan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan akad / investasi"
                    value={addInvestmentForm.keterangan || ""}
                    onChange={(e) => setAddInvestmentForm({ ...addInvestmentForm, keterangan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/database")}
                  className="px-5 py-3 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer uppercase"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvestasi}
                  disabled={isSavingInvestasi}
                  className="px-6 py-3 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingInvestasi ? "Menyimpan..." : "Simpan Data Investasi"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 4: HUTANG */}
          {activeTab === "hutang" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#005E6A]" />
                  <span>Tambah Data Hutang / Kasbon</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catat Kasbon baru atau Pembayaran Hutang pelanggan secara teliti.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={addDebtForm.tanggal || ""}
                    onChange={(e) => setAddDebtForm({ ...addDebtForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    list="customer-debt-list"
                    placeholder="Ketik atau pilih nama pelanggan"
                    value={addDebtForm.nama_pelanggan || ""}
                    onChange={(e) => handleDebtCustomerChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                  <datalist id="customer-debt-list">
                    {customers.map((c, i) => (
                      <option key={`c_debt_${i}`} value={c.nama || c.Nama} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tipe Transaksi
                  </label>
                  <select
                    value={addDebtForm.tipe || "KASBON"}
                    onChange={(e) => {
                      const newTipe = e.target.value as "KASBON" | "BAYAR";
                      const custName = addDebtForm.nama_pelanggan || "";
                      const found = customers.find((c: any) => (c.nama || c.Nama) === custName);
                      const currentHutang = found ? (typeof found.Hutang === 'number' ? found.Hutang : parseFloat(String(found.Hutang || 0))) : 0;
                      const jml = Number(addDebtForm.jumlah) || 0;
                      const newSaldo = newTipe === "KASBON" ? currentHutang + jml : Math.max(0, currentHutang - jml);

                      setAddDebtForm({ ...addDebtForm, tipe: newTipe, saldo_akhir: newSaldo });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  >
                    <option value="KASBON">KASBON (Penambahan Hutang)</option>
                    <option value="BAYAR">BAYAR (Pembayaran Hutang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Jumlah (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={addDebtForm.jumlah || ""}
                    onChange={(e) => handleDebtJumlahChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Estimasi Saldo Akhir Hutang (Rp)
                  </label>
                  <input
                    type="number"
                    value={addDebtForm.saldo_akhir || 0}
                    onChange={(e) => setAddDebtForm({ ...addDebtForm, saldo_akhir: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-xs font-black text-rose-800 dark:text-rose-300 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja barang warung"
                    value={addDebtForm.keterangan || ""}
                    onChange={(e) => setAddDebtForm({ ...addDebtForm, keterangan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#005E6A]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/database")}
                  className="px-5 py-3 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer uppercase"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveHutang}
                  disabled={isSavingHutang}
                  className="px-6 py-3 bg-[#005E6A] hover:bg-[#004e58] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingHutang ? "Menyimpan..." : "Simpan Data Hutang"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
