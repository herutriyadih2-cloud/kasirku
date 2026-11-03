const { Op } = require('sequelize');
const moment = require('moment');
const { Transaction, TransactionItem, Product, Customer, Debt, Employee } = require('../models');

const LAUNDRY_STATUS_FLOW = ['received', 'washing', 'ironing', 'ready', 'completed'];

exports.index = async (req, res) => {
  try {
    const { start, end, status } = req.query;
    const where = { status: { [Op.ne]: 'canceled' } };
    if (start && end) {
      where.transaction_date = {
        [Op.between]: [moment(start).startOf('day').toDate(), moment(end).endOf('day').toDate()],
      };
    }
    if (status) where.laundry_status = status;

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: Employee, as: 'employee', attributes: ['name'] },
        { model: TransactionItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'service_type'] }] },
      ],
      order: [['transaction_date', 'DESC']],
    });
    res.render('transactions/index', { transactions, start: start || '', end: end || '', status: status || '' });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat order' });
  }
};

exports.pos = async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    const employees = await Employee.findAll({ where: { status: 'active' }, order: [['name', 'ASC']] });
    const defaultEstimatedFinish = moment().add(2, 'days').format('YYYY-MM-DD');
    res.render('transactions/pos', { customers, employees, defaultEstimatedFinish });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat kasir' });
  }
};

exports.store = async (req, res) => {
  const { items, weight, payment_method, paid_amount, customer_id, employee_id, discount, estimated_finish_date, note } = req.body;
  try {
    let total = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) throw new Error('Layanan tidak ditemukan');

      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.sale_price_at_time || product.sale_price);
      const itemDiscount = parseFloat(item.discount || 0);
      const subtotal = (price * qty) - itemDiscount;

      transactionItems.push({
        product_id: product.id,
        quantity: qty,
        purchase_price_at_time: product.purchase_price,
        sale_price_at_time: price,
        discount: itemDiscount,
        subtotal,
      });

      total += subtotal;
    }

    const disc = parseFloat(discount || 0);
    total -= disc;
    if (total < 0) total = 0;

    const paid = parseFloat(paid_amount || 0);
    const change = payment_method === 'cash' ? paid - total : 0;
    const status = payment_method === 'credit' ? 'credit' : 'paid';

    const invoiceNumber = 'LDY-' + moment().format('YYYYMMDD') + '-' + Math.floor(1000 + Math.random() * 9000);

    const transaction = await Transaction.create({
      user_id: req.session.userId,
      customer_id: customer_id || null,
      employee_id: employee_id || null,
      invoice_number: invoiceNumber,
      total,
      weight: parseFloat(weight) || 0,
      discount: disc,
      payment_method,
      paid_amount: paid,
      change_amount: change > 0 ? change : 0,
      status,
      laundry_status: 'received',
      estimated_finish_date: estimated_finish_date || null,
      transaction_date: new Date(),
      note,
    });

    await TransactionItem.bulkCreate(transactionItems.map(i => ({ ...i, transaction_id: transaction.id })));

    if (status === 'credit') {
      await Debt.create({
        transaction_id: transaction.id,
        customer_id: customer_id || null,
        type: 'receivable',
        amount: total,
        remaining: total,
        note: `Piutang dari ${invoiceNumber}`,
      });
    }

    res.json({ success: true, transaction_id: transaction.id, invoice_number: invoiceNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { laundry_status } = req.body;
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).render('error', { message: 'Order tidak ditemukan' });
    await transaction.update({ laundry_status });
    res.redirect('/transactions');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal update status' });
  }
};

exports.advanceStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).render('error', { message: 'Order tidak ditemukan' });
    const currentIndex = LAUNDRY_STATUS_FLOW.indexOf(transaction.laundry_status);
    if (currentIndex >= 0 && currentIndex < LAUNDRY_STATUS_FLOW.length - 1) {
      await transaction.update({ laundry_status: LAUNDRY_STATUS_FLOW[currentIndex + 1] });
    }
    res.redirect('/transactions');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal update status' });
  }
};

exports.print = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: Employee, as: 'employee', attributes: ['name'] },
        { model: TransactionItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name'] }] },
      ],
    });
    if (!transaction) return res.status(404).render('error', { message: 'Order tidak ditemukan' });
    res.render('transactions/print', { transaction });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat struk' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).render('error', { message: 'Order tidak ditemukan' });
    await transaction.update({ status: 'canceled', laundry_status: 'canceled' });
    await Debt.update({ status: 'paid', remaining: 0 }, { where: { transaction_id: transaction.id } });
    res.redirect('/transactions');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal membatalkan order' });
  }
};
