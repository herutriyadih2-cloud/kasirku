const net = require('net');

/**
 * Kirim ESC/POS bytes ke printer thermal via TCP/IP (WiFi/LAN)
 * Default port printer thermal: 9100
 */
function printToTcpPrinter(ip, port, data, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!ip || !port) {
      return reject(new Error('IP dan port printer harus diisi'));
    }

    let buffer;
    if (typeof data === 'string') {
      // Asumsi base64
      buffer = Buffer.from(data, 'base64');
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else if (Array.isArray(data)) {
      buffer = Buffer.from(data);
    } else {
      return reject(new Error('Format data tidak didukung'));
    }

    const client = new net.Socket();
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      client.destroy();
      reject(new Error('Timeout koneksi ke printer TCP'));
    }, timeoutMs);

    client.on('connect', () => {
      client.write(buffer, (err) => {
        if (settled) return;
        if (err) {
          settled = true;
          clearTimeout(timer);
          client.destroy();
          return reject(new Error('Gagal mengirim data ke printer: ' + err.message));
        }
        // Tunggu sebentar agar data benar-benar terkirim
        setTimeout(() => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          client.destroy();
          resolve({ success: true, bytesSent: buffer.length });
        }, 500);
      });
    });

    client.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.destroy();
      reject(new Error('Koneksi printer gagal: ' + err.message));
    });

    client.on('close', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ success: true, bytesSent: buffer.length });
      }
    });

    client.connect(parseInt(port), ip);
  });
}

module.exports = { printToTcpPrinter };
