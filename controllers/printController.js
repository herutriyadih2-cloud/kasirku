const { printToTcpPrinter } = require('../services/printerTcpService');

exports.tcpPrint = async (req, res) => {
  try {
    const { ip, port, data } = req.body;
    if (!ip || !data) {
      return res.status(400).json({ success: false, error: 'IP printer dan data struk harus diisi' });
    }

    const printerPort = parseInt(port) || 9100;
    const result = await printToTcpPrinter(ip, printerPort, data);
    res.json({ success: true, message: 'Struk berhasil dikirim ke printer', ...result });
  } catch (err) {
    console.error('TCP Print error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.testTcpPrint = async (req, res) => {
  try {
    const { ip, port } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP printer harus diisi' });
    }

    const printerPort = parseInt(port) || 9100;
    // Test print ESC/POS simple
    const testData = Buffer.from([
      0x1B, 0x40, // init
      0x1B, 0x61, 0x01, // center
      ...Buffer.from('TEST PRINT\nLaundry Suarni\nPrinter WiFi Terhubung!\n'),
      0x1D, 0x56, 0x00 // cut
    ]);

    const result = await printToTcpPrinter(ip, printerPort, testData);
    res.json({ success: true, message: 'Test print berhasil', ...result });
  } catch (err) {
    console.error('Test TCP Print error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
