/**
 * Capacitor Native Print Helper
 * Cross-platform print untuk Android & iOS
 * - Android: Bluetooth Classic SPP ke printer thermal ESC/POS
 * - iOS: Native print dialog (HTML/UIPrintInteractionController)
 * - Web: browser print fallback
 */

(function() {
  'use strict';

  const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

  function getPlatform() {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    if (window.bluetoothClassicSerial && isAndroid) return 'android-native';
    if (window.plugin && window.plugin.printer && isIOS) return 'ios-native';
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return isIOS ? 'ios-native' : 'android-native';
    }
    return 'web';
  }

  function isNative() {
    return getPlatform() === 'android-native' || getPlatform() === 'ios-native';
  }

  const CAP_PRINT = {
    getPlatform: getPlatform,
    isNative: isNative,

    // ===== Android Bluetooth Classic =====
    enableBluetooth: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.enable(resolve, reject);
      });
    },

    isBluetoothEnabled: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.isEnabled(resolve, reject);
      });
    },

    listPaired: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.list(resolve, reject);
      });
    },

    discoverUnpaired: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.discoverUnpaired(resolve, reject);
      });
    },

    connectSPP: function(address, secure) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        const fn = secure !== false ? window.bluetoothClassicSerial.connect : window.bluetoothClassicSerial.connectInsecure;
        fn(address, [SPP_UUID], resolve, reject);
      });
    },

    connectInsecureSPP: function(address) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.connectInsecure(address, [SPP_UUID], resolve, reject);
      });
    },

    isConnectedSPP: function(address) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.isConnected(address, SPP_UUID, resolve, reject);
      });
    },

    disconnectSPP: function(address) {
      return new Promise((resolve) => {
        if (!window.bluetoothClassicSerial) return resolve();
        window.bluetoothClassicSerial.disconnect(address || '', resolve, resolve);
      });
    },

    showBluetoothSettings: function() {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        window.bluetoothClassicSerial.showBluetoothSettings(resolve, reject);
      });
    },

    writeSPP: function(address, data) {
      return new Promise((resolve, reject) => {
        if (!window.bluetoothClassicSerial) return reject(new Error('Bluetooth tidak tersedia'));
        let buffer;
        if (data instanceof Uint8Array) buffer = data.buffer;
        else if (data instanceof ArrayBuffer) buffer = data;
        else if (Array.isArray(data)) buffer = new Uint8Array(data).buffer;
        else return reject(new Error('Data harus berupa Uint8Array/ArrayBuffer atau array angka'));
        window.bluetoothClassicSerial.write(address, SPP_UUID, buffer, resolve, reject);
      });
    },

    // ===== iOS Native Print (cordova-plugin-printer) =====
    printHTML: function(html, options) {
      return new Promise((resolve, reject) => {
        if (!window.plugin || !window.plugin.printer) {
          return reject(new Error('Plugin printer tidak tersedia'));
        }
        window.plugin.printer.print(html, options || {}, resolve, reject);
      });
    },

    checkPrinter: function() {
      return new Promise((resolve, reject) => {
        if (!window.plugin || !window.plugin.printer) {
          return reject(new Error('Plugin printer tidak tersedia'));
        }
        window.plugin.printer.check(resolve, reject);
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

  // ===== UI Helpers =====
  CAP_PRINT.scanDevices = async function() {
    let paired = [];
    let unpaired = [];
    try { paired = await CAP_PRINT.listPaired(); } catch (e) { console.log('paired error', e); }
    try { unpaired = await CAP_PRINT.discoverUnpaired(); } catch (e) { console.log('unpaired error', e); }

    const all = [];
    const seen = new Set();
    [...paired, ...unpaired].forEach(d => {
      if (!seen.has(d.address)) {
        seen.add(d.address);
        all.push(d);
      }
    });
    return all;
  };

  CAP_PRINT.showDevicePicker = async function() {
    try {
      try { await CAP_PRINT.enableBluetooth(); } catch (e) { console.log('enable', e); }
      await CAP_PRINT.isBluetoothEnabled();

      const loadingModal = document.createElement('div');
      loadingModal.className = 'cap-print-modal';
      loadingModal.innerHTML = `
        <div class="cap-print-modal-content text-center">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <h6 class="fw-bold mb-1">Mencari printer Bluetooth...</h6>
          <p class="text-muted small mb-3">Pastikan printer sudah menyala.</p>
          <button type="button" class="btn btn-secondary btn-sm w-100 cap-print-cancel">Batal</button>
        </div>
      `;
      document.body.appendChild(loadingModal);

      let cancelled = false;
      loadingModal.querySelector('.cap-print-cancel').addEventListener('click', () => {
        cancelled = true;
        document.body.removeChild(loadingModal);
      });

      const devices = await CAP_PRINT.scanDevices();

      if (cancelled || !document.body.contains(loadingModal)) return null;
      document.body.removeChild(loadingModal);

      if (!devices || devices.length === 0) {
        alert('Tidak menemukan printer Bluetooth. Pastikan printer menyala dan dalam jangkauan.');
        return null;
      }

      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'cap-print-modal';
        modal.innerHTML = `
          <div class="cap-print-modal-content">
            <h6 class="fw-bold mb-3">Pilih Printer Bluetooth</h6>
            <div class="list-group mb-3" style="max-height: 320px; overflow-y: auto;">
              ${devices.map(d => `
                <button type="button" class="list-group-item list-group-item-action" data-mac="${d.address}">
                  <div class="fw-semibold">${d.name || 'Unknown Device'}</div>
                  <small class="text-muted">${d.address}</small>
                </button>
              `).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm w-100 cap-print-cancel">Batal</button>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelectorAll('.list-group-item').forEach(btn => {
          btn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(btn.dataset.mac);
          });
        });
        modal.querySelector('.cap-print-cancel').addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(null);
        });
      });
    } catch (err) {
      alert('Gagal mengakses Bluetooth: ' + err.message);
      return null;
    }
  };

  CAP_PRINT.connectPrinter = async function(address) {
    try {
      await CAP_PRINT.connectSPP(address, true);
      return true;
    } catch (err1) {
      console.log('Secure connect failed, trying insecure...', err1);
      try {
        await CAP_PRINT.connectInsecureSPP(address);
        return true;
      } catch (err2) {
        throw new Error('Tidak bisa konek ke printer. Pastikan printer sudah dipairing di pengaturan Bluetooth. Error: ' + (err2.message || err2));
      }
    }
  };

  CAP_PRINT.testPrint = async function(address) {
    const e = new CAP_PRINT.EscPosBuilder();
    e.init()
      .align('center')
      .size(1, 1).bold(true).line('TEST PRINT').bold(false).size(0, 0)
      .line('Laundry Suarni')
      .line('Printer terhubung!')
      .feed(3)
      .cut();
    await CAP_PRINT.writeSPP(address, e.toUint8Array());
  };

  CAP_PRINT.printTransaction = async function(tx) {
    const platform = getPlatform();

    if (platform === 'android-native') {
      const mac = await CAP_PRINT.showDevicePicker();
      if (!mac) return;
      try {
        await CAP_PRINT.connectPrinter(mac);
        const data = CAP_PRINT.buildEscPosReceipt(tx);
        await CAP_PRINT.writeSPP(mac, data);
        await CAP_PRINT.disconnectSPP(mac);
        alert('Struk berhasil dicetak.');
      } catch (err) {
        console.error(err);
        alert('Gagal mencetak: ' + err.message);
        try { await CAP_PRINT.disconnectSPP(mac); } catch (e) {}
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
