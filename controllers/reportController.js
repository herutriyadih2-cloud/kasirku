const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { Transaction, TransactionItem, Product, Expense, Income } = require('../models');

function parsePeriod(req) {
  const { start, end } = req.query;
  const s = start ? moment(start).startOf('day').toDate() : moment().startOf('month').toDate();
  const e = end ? moment(end).endOf('day').toDate() : moment().endOf('month').toDate();
  return {
    startDate: s,
    endDate: e,
    startStr: start || moment(s).format('YYYY-MM-DD'),
    endStr: end || moment(e).format('YYYY-MM-DD'),
  };
}

exports.sales = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);

    const transactions = await Transaction.findAll({
      where: {
        status: 'paid',
        transaction_date: { [Op.between]: [startDate, endDate] },
      },
      order: [['transaction_date', 'ASC']],
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalTransactions = transactions.length;

    res.render('reports/sales', {
      transactions,
      totalSales,
      totalTransactions,
      start: startStr,
      end: endStr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat laporan penjualan' });
  }
};

exports.profit = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);

    const items = await TransactionItem.findAll({
      include: [
        {
          model: Transaction,
          where: {
            status: 'paid',
            transaction_date: { [Op.between]: [startDate, endDate] },
          },
        },
        { model: Product, as: 'product', attributes: ['name'] },
      ],
    });

    let totalRevenue = 0;
    let totalCost = 0;
    items.forEach(i => {
      totalRevenue += parseFloat(i.subtotal);
      totalCost += parseFloat(i.purchase_price_at_time) * i.quantity;
    });

    const expenses = await Expense.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;
    const income = await Income.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit + parseFloat(income) - parseFloat(expenses);

    res.render('reports/profit', {
      totalRevenue,
      totalCost,
      grossProfit,
      expenses,
      income,
      netProfit,
      start: startStr,
      end: endStr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat laporan laba/rugi' });
  }
};

exports.stock = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { stock: { [Op.lte]: Sequelize.col('min_stock') } },
      order: [['stock', 'ASC']],
    });
    res.render('reports/stock', { products });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat laporan stok' });
  }
};

// ===== EXPORT EXCEL =====

function sendExcel(res, filename, worksheetName, data, columns) {
  const ws = XLSX.utils.json_to_sheet(data, { header: columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, worksheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}

exports.exportSalesExcel = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);
    const transactions = await Transaction.findAll({
      where: { status: 'paid', transaction_date: { [Op.between]: [startDate, endDate] } },
      order: [['transaction_date', 'ASC']],
    });

    const data = transactions.map(t => ({
      'No Order': t.invoice_number,
      'Tanggal': moment(t.transaction_date).format('YYYY-MM-DD HH:mm'),
      'Total': parseFloat(t.total),
      'Metode Pembayaran': t.payment_method.toUpperCase(),
      'Status': t.status,
    }));

    sendExcel(res, `laporan-penjualan-${startStr}-${endStr}.xlsx`, 'Penjualan', data, ['No Order', 'Tanggal', 'Total', 'Metode Pembayaran', 'Status']);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export Excel' });
  }
};

exports.exportProfitExcel = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);
    const items = await TransactionItem.findAll({
      include: [
        { model: Transaction, where: { status: 'paid', transaction_date: { [Op.between]: [startDate, endDate] } } },
        { model: Product, as: 'product', attributes: ['name'] },
      ],
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const data = items.map(i => {
      const revenue = parseFloat(i.subtotal);
      const cost = parseFloat(i.purchase_price_at_time) * i.quantity;
      totalRevenue += revenue;
      totalCost += cost;
      return {
        'Produk': i.product.name,
        'Qty': i.quantity,
        'Pendapatan': revenue,
        'HPP': cost,
        'Laba Kotor': revenue - cost,
      };
    });

    const expenses = await Expense.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;
    const income = await Income.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit + parseFloat(income) - parseFloat(expenses);

    data.push({ 'Produk': '', 'Qty': '', 'Pendapatan': '', 'HPP': '', 'Laba Kotor': '' });
    data.push({ 'Produk': 'TOTAL', 'Qty': '', 'Pendapatan': totalRevenue, 'HPP': totalCost, 'Laba Kotor': grossProfit });
    data.push({ 'Produk': 'Pemasukan Lain', 'Qty': '', 'Pendapatan': parseFloat(income), 'HPP': '', 'Laba Kotor': '' });
    data.push({ 'Produk': 'Pengeluaran', 'Qty': '', 'Pendapatan': '', 'HPP': parseFloat(expenses), 'Laba Kotor': '' });
    data.push({ 'Produk': 'LABA/RUGI BERSIH', 'Qty': '', 'Pendapatan': '', 'HPP': '', 'Laba Kotor': netProfit });

    sendExcel(res, `laporan-laba-rugi-${startStr}-${endStr}.xlsx`, 'Laba Rugi', data, ['Produk', 'Qty', 'Pendapatan', 'HPP', 'Laba Kotor']);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export Excel' });
  }
};

exports.exportStockExcel = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { stock: { [Op.lte]: Sequelize.col('min_stock') } },
      order: [['stock', 'ASC']],
    });

    const data = products.map(p => ({
      'Kode': p.code,
      'Nama Produk': p.name,
      'Stok': p.stock,
      'Min Stok': p.min_stock,
      'Satuan': p.unit,
      'Status': p.stock === 0 ? 'Habis' : 'Menipis',
    }));

    sendExcel(res, `laporan-stok-menipis-${moment().format('YYYY-MM-DD')}.xlsx`, 'Stok Menipis', data, ['Kode', 'Nama Produk', 'Stok', 'Min Stok', 'Satuan', 'Status']);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export Excel' });
  }
};

// ===== EXPORT PDF =====

function createPDF(title, subtitle) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.font('Helvetica-Bold').fontSize(16).text(title, { align: 'center' });
  if (subtitle) doc.font('Helvetica').fontSize(10).text(subtitle, { align: 'center' });
  doc.moveDown();
  return doc;
}

function sendPDF(res, doc, filename) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.end();
}

exports.exportSalesPDF = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);
    const transactions = await Transaction.findAll({
      where: { status: 'paid', transaction_date: { [Op.between]: [startDate, endDate] } },
      order: [['transaction_date', 'ASC']],
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const doc = createPDF('Laporan Penjualan', `Periode: ${startStr} s/d ${endStr}`);

    doc.font('Helvetica-Bold').fontSize(10).text('No Order', 40, 120);
    doc.text('Tanggal', 180, 120);
    doc.text('Total', 320, 120);
    doc.text('Metode', 420, 120);
    doc.moveTo(40, 135).lineTo(555, 135).stroke();

    let y = 145;
    doc.font('Helvetica').fontSize(9);
    transactions.forEach(t => {
      doc.text(t.invoice_number, 40, y);
      doc.text(moment(t.transaction_date).format('DD/MM/YYYY HH:mm'), 180, y);
      doc.text('Rp ' + Number(t.total).toLocaleString('id-ID'), 320, y);
      doc.text(t.payment_method.toUpperCase(), 420, y);
      y += 18;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 10;
    doc.font('Helvetica-Bold').fontSize(10).text(`Total Penjualan: Rp ${Number(totalSales).toLocaleString('id-ID')}`, 40, y);

    sendPDF(res, doc, `laporan-penjualan-${startStr}-${endStr}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export PDF' });
  }
};

exports.exportProfitPDF = async (req, res) => {
  try {
    const { startDate, endDate, startStr, endStr } = parsePeriod(req);
    const items = await TransactionItem.findAll({
      include: [
        { model: Transaction, where: { status: 'paid', transaction_date: { [Op.between]: [startDate, endDate] } } },
        { model: Product, as: 'product', attributes: ['name'] },
      ],
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const expenses = await Expense.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;
    const income = await Income.sum('amount', { where: { date: { [Op.between]: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')] } } }) || 0;

    const doc = createPDF('Laporan Laba / Rugi', `Periode: ${startStr} s/d ${endStr}`);

    doc.font('Helvetica-Bold').fontSize(10).text('Produk', 40, 120);
    doc.text('Qty', 220, 120);
    doc.text('Pendapatan', 270, 120);
    doc.text('HPP', 370, 120);
    doc.text('Laba Kotor', 450, 120);
    doc.moveTo(40, 135).lineTo(555, 135).stroke();

    let y = 145;
    doc.font('Helvetica').fontSize(9);
    items.forEach(i => {
      const revenue = parseFloat(i.subtotal);
      const cost = parseFloat(i.purchase_price_at_time) * i.quantity;
      totalRevenue += revenue;
      totalCost += cost;
      doc.text(i.product.name, 40, y, { width: 170 });
      doc.text(String(i.quantity), 220, y);
      doc.text('Rp ' + Number(revenue).toLocaleString('id-ID'), 270, y);
      doc.text('Rp ' + Number(cost).toLocaleString('id-ID'), 370, y);
      doc.text('Rp ' + Number(revenue - cost).toLocaleString('id-ID'), 450, y);
      y += 18;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit + parseFloat(income) - parseFloat(expenses);

    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 10;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Total Pendapatan: Rp ${Number(totalRevenue).toLocaleString('id-ID')}`, 40, y);
    y += 16;
    doc.text(`Total HPP: Rp ${Number(totalCost).toLocaleString('id-ID')}`, 40, y);
    y += 16;
    doc.text(`Laba Kotor: Rp ${Number(grossProfit).toLocaleString('id-ID')}`, 40, y);
    y += 16;
    doc.text(`Pemasukan Lain: Rp ${Number(income).toLocaleString('id-ID')}`, 40, y);
    y += 16;
    doc.text(`Pengeluaran: Rp ${Number(expenses).toLocaleString('id-ID')}`, 40, y);
    y += 20;
    doc.fontSize(12).text(`LABA/RUGI BERSIH: Rp ${Number(netProfit).toLocaleString('id-ID')}`, 40, y);

    sendPDF(res, doc, `laporan-laba-rugi-${startStr}-${endStr}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export PDF' });
  }
};

exports.exportStockPDF = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { stock: { [Op.lte]: Sequelize.col('min_stock') } },
      order: [['stock', 'ASC']],
    });

    const doc = createPDF('Laporan Stok Menipis', `Tanggal: ${moment().format('DD MMM YYYY')}`);

    doc.font('Helvetica-Bold').fontSize(10).text('Kode', 40, 120);
    doc.text('Nama Produk', 140, 120);
    doc.text('Stok', 330, 120);
    doc.text('Min Stok', 390, 120);
    doc.text('Status', 460, 120);
    doc.moveTo(40, 135).lineTo(555, 135).stroke();

    let y = 145;
    doc.font('Helvetica').fontSize(9);
    products.forEach(p => {
      doc.text(p.code, 40, y);
      doc.text(p.name, 140, y, { width: 180 });
      doc.text(String(p.stock), 330, y);
      doc.text(String(p.min_stock), 390, y);
      doc.text(p.stock === 0 ? 'Habis' : 'Menipis', 460, y);
      y += 18;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    sendPDF(res, doc, `laporan-stok-menipis-${moment().format('YYYY-MM-DD')}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal export PDF' });
  }
};
