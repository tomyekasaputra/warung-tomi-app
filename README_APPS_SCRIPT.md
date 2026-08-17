# Panduan Sinkronisasi Spreadsheet dengan Google Apps Script

Untuk menyinkronkan seluruh data pelanggan secara otomatis dan akurat ke Google Spreadsheet, ikuti langkah-langkah berikut:

## 1. Persiapan Spreadsheet
- Buat Spreadsheet baru di Google Drive.
- Beri nama Sheet pertama sebagai **"Pelanggan"** (atau **"Data Pelanggan"**).
- Baris pertama (Header) disinkronkan secara otomatis dalam 14 urutan kolom berikut:
  1. `id pelanggan`
  2. `nama`
  3. `tabungan`
  4. `investasi`
  5. `lainnya`
  6. `hutang`
  7. `level`
  8. `poin`
  9. `total belanja bulan ini`
  10. `peringkat`
  11. `aktivitas terakhir`
  12. `mutasi tabungan`
  13. `catatan hutang`
  14. `terakhir diperbarui`

## 2. Pemasangan Apps Script
- Di Google Spreadsheet Anda, buka Menu **Extensions** (Ekstensi) > **Apps Script**.
- Hapus semua baris kode yang ada dan tempelkan kode di bawah ini:

```javascript
const SHEET_NAME = "Pelanggan";

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return response([]);
  
  const headers = data.shift();
  const result = data.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  return response(result);
}

function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : "{}";
    const params = JSON.parse(contents);
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    
    // 1. SINKRONISASI SELURUH PELANGGAN SEKALIGUS (SYNC ALL)
    if (action === "syncCustomers" || action === "SYNC_ALL" || Array.isArray(params.customers)) {
      const customers = params.customers || [];
      const headers = [
        "id pelanggan",
        "nama",
        "tabungan",
        "investasi",
        "lainnya",
        "hutang",
        "level",
        "poin",
        "total belanja bulan ini",
        "peringkat",
        "aktivitas terakhir",
        "mutasi tabungan",
        "catatan hutang",
        "terakhir diperbarui"
      ];
      
      const rows = customers.map(function(c, index) {
        var idPel = c.id_pelanggan || c["id pelanggan"] || c.id || ("CUST-" + String(index + 1).padStart(4, "0"));
        var nama = c.nama || c.Nama || "Pelanggan";
        var tabungan = Number(c.tabungan ?? c.Tabungan ?? 0);
        var investasi = Number(c.investasi ?? c.Investasi ?? 0);
        var lainnya = Number(c.lainnya ?? c.Lainnya ?? 0);
        var hutang = Number(c.hutang ?? c.Hutang ?? 0);
        var level = c.level || c.Level || "Bronze";
        var poin = Number(c.poin ?? c.point ?? c.Poin ?? c.Point ?? 0);
        var totalBelanja = Number(c.total_belanja_bulan_ini ?? c["total belanja bulan ini"] ?? c.TotalBelanjaBulanIni ?? 0);
        var peringkat = c.peringkat || c.Peringkat || "Belum ada belanja bulan ini";
        var aktivitas = c.aktivitas_terakhir || c["aktivitas terakhir"] || c.AktivitasTerakhir || c.aktivitas || "Belum ada aktivitas";
        var mutasiTab = c.mutasi_tabungan || c["mutasi tabungan"] || c.MutasiTabungan || "Belum ada mutasi tabungan";
        var catatanHut = c.catatan_hutang || c["catatan hutang"] || c.CatatanHutang || "Belum ada catatan hutang";
        var terakhir = c.terakhir_diperbarui || c["terakhir diperbarui"] || c.TerakhirDiperbarui || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
        
        return [
          idPel,
          nama,
          tabungan,
          investasi,
          lainnya,
          hutang,
          level,
          poin,
          totalBelanja,
          peringkat,
          aktivitas,
          mutasiTab,
          catatanHut,
          terakhir
        ];
      });
      
      sheet.clearContents();
      var outputData = [headers].concat(rows);
      if (outputData.length > 0) {
        sheet.getRange(1, 1, outputData.length, headers.length).setValues(outputData);
      }
      
      return response({ 
        success: true, 
        count: rows.length, 
        message: "Berhasil menyinkronkan seluruh " + rows.length + " data pelanggan secara otomatis" 
      });
    }
    
    // 2. OPERASI CRUD SATUAN (ADD, UPDATE, DELETE)
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [
      "id pelanggan", "nama", "tabungan", "investasi", "lainnya", "hutang",
      "level", "poin", "total belanja bulan ini", "peringkat",
      "aktivitas terakhir", "mutasi tabungan", "catatan hutang", "terakhir diperbarui"
    ];
    
    if (action === "ADD") {
      const newId = generateNextId(data);
      const newRow = headers.map(header => {
        const hClean = String(header).toLowerCase().replace(/_/g, ' ');
        if (hClean === "id pelanggan" || header === "id_pelanggan") return newId;
        return params.data[header] || params.data[hClean] || "";
      });
      sheet.appendRow(newRow);
      return response({ success: true, id: newId });
    }
    
    if (action === "UPDATE") {
      const id = params.data.id_pelanggan || params.data["id pelanggan"] || params.data.id;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          const rowValues = headers.map((header, colIdx) => {
            const hClean = String(header).toLowerCase().replace(/_/g, ' ');
            if (hClean === "id pelanggan" || header === "id_pelanggan") return id;
            const val = params.data[header] !== undefined ? params.data[header] : params.data[hClean];
            return val !== undefined ? val : data[i][colIdx];
          });
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowValues]);
          return response({ success: true });
        }
      }
      return response({ success: false, message: "ID tidak ditemukan" });
    }
    
    if (action === "DELETE") {
      const id = params.id || params.id_pelanggan;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          sheet.deleteRow(i + 1);
          return response({ success: true });
        }
      }
      return response({ success: false, message: "ID tidak ditemukan" });
    }

    return response({ success: false, message: "Aksi tidak dikenali: " + action });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function generateNextId(data) {
  if (data.length <= 1) return "CUST-0001";
  
  let maxId = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0) {
      const idVal = String(row[0] || '').trim();
      const match = idVal.match(/CUST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
  }
  
  const nextNum = maxId + 1;
  return "CUST-" + String(nextNum).padStart(4, '0');
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deployment
- Klik tombol **Deploy** > **New Deployment**.
- Pilih type **Web App**.
- Deskripsi: `Sinkronisasi Seluruh Pelanggan v2`.
- Execute as: **Me**.
- Who has access: **Anyone**.
- Klik **Deploy** dan berikan izin yang diminta (Authorize Access).
- Salin **Web App URL** yang muncul.

## 4. Konfigurasi di Aplikasi
- Tempelkan URL tersebut pada menu Manajemen Pelanggan > Konfigurasi Google Sheets untuk mengaktifkan sinkronisasi otomatis seluruh pelanggan.
