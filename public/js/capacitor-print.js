/**
 * Universal Printer Manager untuk Laundry Suarni Kasir
 * Support:
 * - Android: Bluetooth Classic SPP, Bluetooth LE, WiFi/TCP (via backend proxy)
 * - iOS: AirPrint/native print dialog, Bluetooth LE, WiFi/TCP (via backend proxy)
 * - Web: Browser print, WiFi/TCP (via backend proxy)
 */

(function() {
  'use strict';

  const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

  // Default Nordic UART Service UUIDs untuk BLE printer
  const DEFAULT_BLE = {
    service: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
    txChar: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
    rxChar: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'
  };

  const STORAGE_KEY = 'printer_config_v1';

  function getPlatform() {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return isIOS ? 'ios-native' : 'android-native';
    }
    return 'web';
  }

  function isNative() {
    return getPlatform() === 'android-native' || getPlatform() === 'ios-native';
  }

  function isAndroidNative() {
    return getPlatform() === 'android-native';
  }

  function isIOSNative() {
    return getPlatform() === 'ios-native';
  }

  function hasBluetoothClassic() {
    return !!window.bluetoothClassicSerial;
  }

  function hasBluetoothLE() {
    return !!(window.BleClient || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BluetoothLe));
  }

  function getBleClient() {
    return window.BleClient || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BluetoothLe);
  }

  function hasNativePrinter() {
    return !!(window.plugin && window.plugin.printer);
  }

  const CAP_PRINT = {
    getPlatform: getPlatform,
    isNative: isNative,
    isAndroidNative: isAndroidNative,
    isIOSNative: isIOSNative,
    hasBluetoothClassic: hasBluetoothClassic,
    hasBluetoothLE: hasBluetoothLE,
    hasNativePrinter: hasNativePrinter,

    // ===== Config Management =====
    getConfig: function() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { type: 'none' };
      } catch (e) {
        return { type: 'none' };
      }
    },

    saveConfig: function(config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    },

    clearConfig: function() {
      localStorage.removeItem(STORAGE_KEY);
    },

    // ===== Android Bluetooth Classic =====
    enableBluetooth: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.enable(resolve, reject);
      });
    },

    isBluetoothEnabled: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.isEnabled(resolve, reject);
      });
    },

    listPaired: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.list(resolve, reject);
      });
    },

    discoverUnpaired: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.discoverUnpaired(resolve, reject);
      });
    },

    connectSPP: function(address, secure) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        const fn = secure !== false ? window.bluetoothClassicSerial.connect : window.bluetoothClassicSerial.connectInsecure;
        fn(address, [SPP_UUID], resolve, reject);
      });
    },

    connectInsecureSPP: function(address) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.connectInsecure(address, [SPP_UUID], resolve, reject);
      });
    },

    disconnectSPP: function(address) {
      return new Promise((resolve) => {
        if (!window.bluetoothClassicSerial) return resolve();
        window.bluetoothClassicSerial.disconnect(address || '', resolve, resolve);
      });
    },

    writeSPP: function(address, data) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        let buffer;
        if (data instanceof Uint8Array) buffer = data.buffer;
        else if (data instanceof ArrayBuffer) buffer = data;
        else if (Array.isArray(data)) buffer = new Uint8Array(data).buffer;
        else return reject(new Error('Data harus berupa Uint8Array/ArrayBuffer atau array angka'));
        window.bluetoothClassicSerial.write(address, SPP_UUID, buffer, resolve, reject);
      });
    },

    showBluetoothSettings: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth Classic tidak tersedia'));
        window.bluetoothClassicSerial.showBluetoothSettings(resolve, reject);
      });
    },

    // ===== Bluetooth LE =====
    initBLE: async function() {
      const BleClient = getBleClient();
      if (!BleClient) throw new Error('Bluetooth LE tidak tersedia');
      await BleClient.initialize();
    },

    scanBLE: async function(timeoutMs = 10000) {
      const BleClient = getBleClient();
      if (!BleClient) throw new Error('Bluetooth LE tidak tersedia');
      await BleClient.initialize();
      await BleClient.requestLEScan({}, (result) => {
        if (CAP_PRINT._bleScanCallback) CAP_PRINT._bleScanCallback(result);
      });
      setTimeout(async () => {
        try { await BleClient.stopLEScan(); } catch (e) {}
      }, timeoutMs);
    },

    stopScanBLE: async function() {
      const BleClient = getBleClient();
      if (!BleClient) return;
      try { await BleClient.stopLEScan(); } catch (e) {}
    },

    connectBLE: async function(deviceId) {
      const BleClient = getBleClient();
      if (!BleClient) throw new Error('Bluetooth LE tidak tersedia');
      await BleClient.connect(deviceId);
    },

    disconnectBLE: async function(deviceId) {
      const BleClient = getBleClient();
      if (!BleClient) return;
      try { await BleClient.disconnect(deviceId); } catch (e) {}
    },

    writeBLE: async function(deviceId, serviceUuid, characteristicUuid, data) {
      const BleClient = getBleClient();
      if (!BleClient) throw new Error('Bluetooth LE tidak tersedia');
      let buffer;
      if (data instanceof Uint8Array) buffer = data;
      else if (Array.isArray(data)) buffer = new Uint8Array(data);
      else if (typeof data === 'string') buffer = new Uint8Array(data.split('').map(c => c.charCodeAt(0)));
      else throw new Error('Format data BLE tidak didukung');
      await BleClient.writeWithoutResponse(deviceId, serviceUuid, characteristicUuid, buffer);
    },

    // ===== WiFi / TCP via Backend Proxy =====
    printViaTcpProxy: async function(ip, port, data) {
      const base64 = dataToBase64(data);
      const res = await fetch('/api/print/tcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: port || 9100, data: base64 })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal print via TCP');
      return json;
    },

    testTcpProxy: async function(ip, port) {
      const res = await fetch('/api/print/tcp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: port || 9100 })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal test print TCP');
      return json;
    },

    // ===== iOS Native Print (AirPrint) =====
    printHTML: function(html, options) {
      return new Promise((resolve, reject) => {
        if (!window.plugin || !window.plugin.printer) {
          return reject(new Error('Plugin printer tidak tersedia'));
        }
        window.plugin.printer.print(html, options || {}, resolve, reject);
      });
    },

    // ===== ESC/POS Encoder =====
    EscPosBuilder: function() {
      this.buffer = [];
    }
  };

  CAP_PRINT.EscPosBuilder.prototype = {
    raw: function(bytes) {
      if (typeof bytes === 'string') {
        for (let i = 0; i < bytes.length; i++) {
          this.buffer.push(bytes.charCodeAt(i) & 0xFF);
        }
      } else if (Array.isArray(bytes)) {
        this.buffer.push(...bytes);
      } else if (bytes instanceof Uint8Array) {
        this.buffer.push(...bytes);
      }
      return this;
    },
    init: function() { return this.raw([0x1B, 0x40]); },
    align: function(pos) {
      const p = pos === 'center' ? 1 : (pos === 'right' ? 2 : 0);
      return this.raw([0x1B, 0x61, p]);
    },
    text: function(str) { return this.raw(str); },
    line: function(str) { return this.text(str || '').raw([0x0A]); },
    feed: function(n) { return this.raw(Array(n || 1).fill(0x0A)); },
    bold: function(on) { return this.raw([0x1B, 0x45, on ? 1 : 0]); },
    size: function(width, height) {
      const w = width ? 1 : 0;
      const h = height ? 1 : 0;
      return this.raw([0x1D, 0x21, (h << 4) | w]);
    },
    cut: function() { return this.raw([0x1D, 0x56, 0x00]); },
    toUint8Array: function() { return new Uint8Array(this.buffer); }
  };

  function dataToBase64(data) {
    if (data instanceof Uint8Array) {
      let binary = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(data[i]);
      return btoa(binary);
    }
    if (Array.isArray(data)) return dataToBase64(new Uint8Array(data));
    if (typeof data === 'string') return btoa(data);
    throw new Error('Format data tidak bisa dikonversi ke base64');
  }

  CAP_PRINT.buildEscPosReceipt = function(tx) {
    const e = new CAP_PRINT.EscPosBuilder();
    const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    const ls = { received: 'DITERIMA', washing: 'DICUCI', ironing: 'DISETRIKA', ready: 'SIAP AMBIL', completed: 'SELESAI', canceled: 'DIBATALKAN' };

    e.init()
      .align('center')
      .size(1, 1).bold(true).line('LAUNDRY SUARNI').bold(false).size(0, 0)
      .line('Biar Kami yang Cuci,')
      .line('Kamu Fokus Raih Mimpi.')
      .line('Jl. Contoh No. 123')
      .line('Telp: 08123456789')
      .feed(1)
      .align('left')
      .line('No Order: ' + tx.invoice_number)
      .line('Tgl: ' + new Date(tx.transaction_date).toLocaleString('id-ID'))
      .line('Kasir: ' + (tx.user_name || '-'))
      .line('Petugas: ' + (tx.employee_name || '-'))
      .line('Pelanggan: ' + (tx.customer_name || '-'))
      .line('Telp: ' + (tx.customer_phone || '-'))
      .line('Estimasi: ' + (tx.estimated_finish_date ? new Date(tx.estimated_finish_date).toLocaleDateString('id-ID') : '-'))
      .line('--------------------------------')
      .feed(1);

    tx.items.forEach(item => {
      e.line(item.product_name)
        .line(item.quantity + ' x ' + fmt(item.sale_price_at_time) + ' = ' + fmt(item.subtotal));
      if (item.discount > 0) {
        e.line('  Diskon: -' + fmt(item.discount));
      }
    });

    if (tx.weight > 0) {
      e.line('Berat Total: ' + tx.weight + ' kg');
    }

    e.line('--------------------------------')
      .line('Subtotal: ' + fmt(Number(tx.total) + Number(tx.discount)))
      .line('Diskon: -' + fmt(tx.discount))
      .bold(true)
      .size(1, 0)
      .line('TOTAL: ' + fmt(tx.total))
      .size(0, 0)
      .bold(false)
      .line('Bayar: ' + fmt(tx.paid_amount))
      .line('Kembalian: ' + fmt(tx.change_amount))
      .line('Metode: ' + (tx.payment_method || '').toUpperCase())
      .line('--------------------------------')
      .align('center')
      .line('Status: ' + (ls[tx.laundry_status] || tx.laundry_status))
      .feed(1)
      .line('Terima kasih telah mempercayakan')
      .line('cucian Anda!')
      .feed(3)
      .cut();

    return e.toUint8Array();
  };

  CAP_PRINT.buildHTMLReceipt = function(tx) {
    const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    const ls = { received: 'DITERIMA', washing: 'DICUCI', ironing: 'DISETRIKA', ready: 'SIAP AMBIL', completed: 'SELESAI', canceled: 'DIBATALKAN' };

    let itemsHtml = '';
    tx.items.forEach(item => {
      itemsHtml += `
        <div style="margin-bottom:8px;font-size:14px;">
          <div style="font-weight:600;">${item.product_name}</div>
          <div style="display:flex;justify-content:space-between;">
            <span>${item.quantity} x ${fmt(item.sale_price_at_time)}</span>
            <span>${fmt(item.subtotal)}</span>
          </div>
          ${item.discount > 0 ? `<div style="font-size:12px;color:#dc3545;">Diskon: -${fmt(item.discount)}</div>` : ''}
        </div>
      `;
    });

    return `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; color: #000; background: #fff; font-size: 14px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #999; margin: 12px 0; }
          .flex { display: flex; justify-content: space-between; }
          .store { font-size: 18px; font-weight: bold; }
          .small { font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="store">LAUNDRY SUARNI</div>
          <div class="small">Biar Kami yang Cuci,</div>
          <div class="small">Kamu Fokus Raih Mimpi.</div>
          <div class="small">Jl. Contoh No. 123</div>
          <div class="small">Telp: 08123456789</div>
        </div>
        <div class="line"></div>
        <div>
          <div>No Order: ${tx.invoice_number}</div>
          <div>Tgl: ${new Date(tx.transaction_date).toLocaleString('id-ID')}</div>
          <div>Kasir: ${tx.user_name || '-'}</div>
          <div>Petugas: ${tx.employee_name || '-'}</div>
          <div>Pelanggan: ${tx.customer_name || '-'}</div>
          <div>Telp: ${tx.customer_phone || '-'}</div>
          <div>Estimasi: ${tx.estimated_finish_date ? new Date(tx.estimated_finish_date).toLocaleDateString('id-ID') : '-'}</div>
        </div>
        <div class="line"></div>
        ${itemsHtml}
        ${tx.weight > 0 ? `<div class="flex"><span>Berat Total</span><span>${tx.weight} kg</span></div>` : ''}
        <div class="line"></div>
        <div class="flex"><span>Subtotal</span><span>${fmt(Number(tx.total) + Number(tx.discount))}</span></div>
        <div class="flex"><span>Diskon</span><span>-${fmt(tx.discount)}</span></div>
        <div class="flex bold" style="font-size:16px;margin-top:8px;"><span>TOTAL</span><span>${fmt(tx.total)}</span></div>
        <div class="flex"><span>Bayar</span><span>${fmt(tx.paid_amount)}</span></div>
        <div class="flex"><span>Kembalian</span><span>${fmt(tx.change_amount)}</span></div>
        <div class="flex"><span>Metode</span><span>${(tx.payment_method || '').toUpperCase()}</span></div>
        <div class="line"></div>
        <div class="center">
          <div class="bold">Status: ${ls[tx.laundry_status] || tx.laundry_status}</div>
          <div class="small" style="margin-top:8px;">Terima kasih telah mempercayakan cucian Anda!</div>
        </div>
      </body>
      </html>
    `;
  };

  CAP_PRINT.scanDevicesClassic = async function() {
    let paired = [];
    let unpaired = [];
    try { paired = await CAP_PRINT.listPaired(); } catch (e) {}
    try { unpaired = await CAP_PRINT.discoverUnpaired(); } catch (e) {}

    const all = [];
    const seen = new Set();
    [...paired, ...unpaired].forEach(d => {
      if (!seen.has(d.address)) {
        seen.add(d.address);
        all.push({ ...d, type: 'classic' });
      }
    });
    return all;
  };

  CAP_PRINT.connectPrinterClassic = async function(address) {
    try {
      await CAP_PRINT.connectSPP(address, true);
      return true;
    } catch (err1) {
      try {
        await CAP_PRINT.connectInsecureSPP(address);
        return true;
      } catch (err2) {
        throw new Error('Tidak bisa konek ke printer Bluetooth Classic. Pastikan sudah dipairing. Error: ' + (err2.message || err2));
      }
    }
  };

  CAP_PRINT.printEscPos = async function(data, connectionType, config) {
    if (connectionType === 'classic') {
      await CAP_PRINT.connectPrinterClassic(config.address);
      await CAP_PRINT.writeSPP(config.address, data);
      await CAP_PRINT.disconnectSPP(config.address);
      return true;
    }

    if (connectionType === 'ble') {
      await CAP_PRINT.connectBLE(config.deviceId);
      await CAP_PRINT.writeBLE(config.deviceId, config.serviceUuid, config.txCharUuid, data);
      await CAP_PRINT.disconnectBLE(config.deviceId);
      return true;
    }

    if (connectionType === 'tcp') {
      await CAP_PRINT.printViaTcpProxy(config.ip, config.port, data);
      return true;
    }

    throw new Error('Tipe koneksi printer tidak dikenal: ' + connectionType);
  };

  CAP_PRINT.testPrint = async function(connectionType, config) {
    const e = new CAP_PRINT.EscPosBuilder();
    e.init()
      .align('center')
      .size(1, 1).bold(true).line('TEST PRINT').bold(false).size(0, 0)
      .line('Laundry Suarni')
      .line('Printer terhubung!')
      .feed(3)
      .cut();
    await CAP_PRINT.printEscPos(e.toUint8Array(), connectionType, config);
  };

  CAP_PRINT.printTransaction = async function(tx) {
    const platform = getPlatform();
    const config = CAP_PRINT.getConfig();

    // Jika ada konfigurasi printer tersimpan, gunakan itu
    if (config.type && config.type !== 'none' && config.type !== 'airprint') {
      try {
        const data = CAP_PRINT.buildEscPosReceipt(tx);
        await CAP_PRINT.printEscPos(data, config.type, config);
        alert('Struk berhasil dicetak.');
      } catch (err) {
        console.error(err);
        alert('Gagal mencetak: ' + err.message + '\n\nCoba buka Pengaturan Printer untuk cek koneksi.');
      }
      return;
    }

    // Default platform-specific
    if (platform === 'android-native') {
      if (!hasBluetoothClassic()) {
        alert('Plugin Bluetooth Classic tidak tersedia.');
        return;
      }
      try {
        const devices = await CAP_PRINT.scanDevicesClassic();
        if (!devices.length) {
          alert('Tidak menemukan printer Bluetooth. Pastikan printer sudah dipairing.');
          return;
        }
        // Sederhana: pakai printer pertama yang ditemukan (bisa diperbaiki dengan picker)
        const printer = devices.find(d => d.name && /printer|print|pos|thermal|odi|blue|m100|58|80/i.test(d.name)) || devices[0];
        await CAP_PRINT.connectPrinterClassic(printer.address);
        const data = CAP_PRINT.buildEscPosReceipt(tx);
        await CAP_PRINT.writeSPP(printer.address, data);
        await CAP_PRINT.disconnectSPP(printer.address);
        alert('Struk berhasil dicetak.');
      } catch (err) {
        console.error(err);
        alert('Gagal mencetak: ' + err.message);
      }
      return;
    }

    if (platform === 'ios-native') {
      try {
        const html = CAP_PRINT.buildHTMLReceipt(tx);
        await CAP_PRINT.printHTML(html, { name: 'struk-laundry', duplex: false, landscape: false, grayscale: true });
      } catch (err) {
        console.error(err);
        alert('Gagal mencetak: ' + err.message);
      }
      return;
    }

    alert('Fitur print Bluetooth native hanya tersedia di aplikasi Android/iOS.');
  };

  // Expose global
  window.CAP_PRINT = CAP_PRINT;
})();
