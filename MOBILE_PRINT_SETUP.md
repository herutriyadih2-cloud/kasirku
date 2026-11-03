# Setup Print di HP Android & iOS

Aplikasi Laundry Suarni Kasir sudah ditambahkan dukungan native untuk Android dan iOS melalui Capacitor.

## Platform Support

| Platform | Mode Print | Keterangan |
|----------|-----------|------------|
| **Android** | Bluetooth Classic SPP | Print langsung ke printer thermal Bluetooth ESC/POS, termasuk yang belum dipairing |
| **iOS** | AirPrint / Native Print Dialog | Menggunakan dialog print bawaan iOS, cocok untuk printer yang support AirPrint atau printer yang terdeteksi sistem iOS |
| **Web/Browser** | Browser Print | Tombol cetak biasa (`window.print()`) |

## Plugin yang Digunakan

- `cordova-plugin-bluetooth-classic-serial-port` v2.0.0 → Android Bluetooth Classic SPP
- `cordova-plugin-printer` v0.8.0 → iOS native print dialog

## Fitur Android

- Nyalakan Bluetooth dari aplikasi
- Scan printer di sekitar (termasuk belum dipairing)
- Pairing otomatis saat connect
- Connect SPP dan kirim ESC/POS raw bytes

## Fitur iOS

- Cetak struk menggunakan native iOS print dialog
- Support AirPrint dan printer yang terdeteksi iOS
- Tidak perlu pairing Bluetooth manual

## Persyaratan Build

### Android

- Java Development Kit (JDK) 17 atau 21
- Android Studio
- Android SDK
- Variabel: `JAVA_HOME`, `ANDROID_HOME`

### iOS

- Mac dengan macOS
- Xcode (terbaru)
- Apple Developer account untuk build ke device (opsional untuk simulator)

## Konfigurasi Server URL

Sebelum build, ubah `server.url` di `capacitor.config.js` ke IP komputer/server tempat aplikasi Node.js dijalankan:

```js
server: {
  url: 'http://192.168.1.10:3000',  // ganti dengan IP server
  cleartext: true,
  allowNavigation: ['*']
}
```

HP/Android/iOS dan server harus berada dalam jaringan WiFi yang sama.

## Langkah Build

### Android

```bash
cd C:\Users\drago\app-kasir
npx cap sync android
npx cap open android
```

Di Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**

APK hasilnya di `android/app/build/outputs/apk/debug/app-debug.apk`.

### iOS

```bash
cd C:\Users\drago\app-kasir
npx cap sync ios
npx cap open ios
```

Di Xcode:

1. Pilih target device/simulator
2. Klik tombol **Run** atau **Product > Build**
3. Untuk build ke iPhone fisik, perlu Apple Developer account dan provisioning profile

## Cara Pakai

### Android

1. Install APK, buka aplikasi
2. Masuk ke halaman struk, tekan **Cetak Bluetooth**
3. Izinkan Bluetooth jika diminta
4. Pilih printer thermal dari daftar
5. Konfirmasi dialog pairing jika muncul
6. Struk tercetak

### iOS

1. Install app, buka aplikasi
2. Masuk ke halaman struk, tekan **Cetak (AirPrint)**
3. Pilih printer dari dialog print iOS
4. Struk tercetak

## Catatan Penting

### Android

- Printer thermal harus support **ESC/POS**
- Untuk Android 12+, izinkan permission **Nearby devices / Bluetooth**
- Jika scan tidak menemukan printer, pastikan printer menyala dan mode discoverable

### iOS

- iOS tidak bisa konek langsung ke printer thermal Bluetooth Classic SPP seperti Android
- Untuk iOS, gunakan printer yang support **AirPrint** atau printer yang muncul di dialog print iOS
- Alternatif: share struk ke aplikasi print pihak ketiga dari Safari/browser

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tombol native print tidak muncul | Pastikan aplikasi dibuka dari APK/IPA, bukan browser |
| Android tidak bisa scan printer | Izinkan semua permission Bluetooth, restart aplikasi |
| iOS tidak menemukan printer | Pastikan printer support AirPrint atau terhubung ke jaringan yang sama |
| Build iOS gagal | Pastikan menggunakan Mac + Xcode, bukan Windows |
