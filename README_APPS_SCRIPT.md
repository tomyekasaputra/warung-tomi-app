# Panduan Sinkronisasi Spreadsheet dengan Google Apps Script

Untuk menjalankan fungsi CRUD (Tambah, Edit, Hapus) pelanggan, ikuti langkah-langkah berikut:

## 1. Persiapan Spreadsheet
- Buat Spreadsheet baru di Google Drive.
- Beri nama Sheet pertama sebagai **"Pelanggan"**.
- Baris pertama (Header) harus berisi kolom berikut:
  `id_pelanggan`, `nama`, `pin`, `foto`, `tabungan`, `investasi`, `lainnya`, `hutang`, `poin`, `level`

## 2. Pemasangan Apps Script
- Buka Menu **Extensions** > **Apps Script**.
- Hapus semua baris kode yang ada dan tempelkan kode di bawah ini:

```javascript
const SHEET_NAME = "Pelanggan";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const result = data.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    if (action === "ADD") {
      const newId = generateNextId(data);
      const newRow = headers.map(header => {
        if (header === "id_pelanggan") return newId;
        return params.data[header] || "";
      });
      sheet.appendRow(newRow);
      return response({ success: true, id: newId });
    }
    
    if (action === "UPDATE") {
      const id = params.data.id_pelanggan;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          const rowValues = headers.map((header, colIdx) => {
            if (header === "id_pelanggan") return id;
            return params.data[header] !== undefined ? params.data[header] : data[i][colIdx];
          });
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowValues]);
          return response({ success: true });
        }
      }
      return response({ success: false, message: "ID tidak ditemukan" });
    }
    
    if (action === "DELETE") {
      const id = params.id;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          sheet.deleteRow(i + 1);
          return response({ success: true });
        }
      }
      return response({ success: false, message: "ID tidak ditemukan" });
    }
    
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
- Deskripsi: `Manajemen Pelanggan v1`.
- Execute as: **Me**.
- Who has access: **Anyone**.
- Klik **Deploy** dan berikan izin yang diminta (Authorize Access).
- Salin **Web App URL** yang muncul.

## 4. Konfigurasi di Aplikasi
- Saat membuka halaman Manajemen Pelanggan di aplikasi, Anda akan diminta memasukkan URL tersebut.
- Tempelkan URL yang Anda salin tadi untuk mulai menggunakan fitur CRUD pelanggan.
