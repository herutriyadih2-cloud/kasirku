# Laundry Suarni - Aplikasi Kasir Laundry

Aplikasi kasir laundry lengkap berbasis web dengan Node.js + Express + PostgreSQL. Desain modern mengikuti model dashboard SaaS seperti Santai Scale.

## Fitur

- ✅ Autentikasi multi-user (admin, kasir, owner)
- ✅ Manajemen layanan laundry (kiloan & satuan)
- ✅ Manajemen kategori layanan, pelanggan, supplier, karyawan
- ✅ Order laundry dengan perhitungan berat & qty
- ✅ Status cucian: Diterima → Dicuci → Disetrika → Siap Ambil → Selesai
- ✅ Estimasi tanggal selesai
- ✅ Pembayaran tunai, transfer, QRIS, bon/piutang
- ✅ Cetak struk laundry (kompatibel printer thermal)
- ✅ Dukungan cetak struk native dari HP Android & iOS (APK/IPA Capacitor) — lihat `MOBILE_PRINT_SETUP.md`
- ✅ Pembukuan pengeluaran & pemasukan lain
- ✅ Hutang-piutang dengan pelunasan parsial
- ✅ Laporan penjualan, laba/rugi, dan stok menipis
- ✅ Dashboard ringkasan bisnis harian

## Prasyarat

- Node.js (sudah terinstall)
- PostgreSQL 17 (sudah diinstall otomatis)
- Database `kasir_db` dan user `kasir_user` (sudah dibuat)

## Cara Menjalankan

```bash
cd C:\Users\drago\app-kasir
npm start
```

Buka browser di: **http://localhost:3000**

## Login Default

- Username: `admin`
- Password: `admin123`

## Info Database

- Database: `kasir_db`
- User: `kasir_user`
- Password: `kasir_pass`
- PostgreSQL superuser password: `kasir123`

## Teknologi

- Node.js + Express.js
- Sequelize ORM + PostgreSQL
- EJS Template Engine
- Bootstrap 5 + Bootstrap Icons
- express-session + bcryptjs
