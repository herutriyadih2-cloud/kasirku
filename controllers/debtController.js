const { Op } = require('sequelize');
const { Debt, Payment, Customer, Supplier, Transaction } = require('../models');

exports.index = async (req, res) => {
  try {
    const { type } = req.query;
    const where = {};
    if (type) where.type = type;

    const debts = await Debt.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['name'] },
        { model: Supplier, as: 'supplier', attributes: ['name'] },
        { model: Transaction, as: 'transaction', attributes: ['invoice_number'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });

    res.render('debts/index', { debts, customers, suppliers, type: type || '' });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat hutang/piutang' });
  }
};

exports.create = async (req, res) => {
  try {
    const { type, customer_id, supplier_id, amount, due_date, note } = req.body;
    await Debt.create({
      type,
      customer_id: customer_id || null,
      supplier_id: supplier_id || null,
      amount,
      remaining: amount,
      due_date,
      note,
    });
    res.redirect('/debts');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal membuat hutang/piutang' });
  }
};

exports.pay = async (req, res) => {
  try {
    const { amount, payment_date, note } = req.body;
    const debt = await Debt.findByPk(req.params.id);
    if (!debt) return res.status(404).render('error', { message: 'Hutang/piutang tidak ditemukan' });

    const paidAmount = parseFloat(amount);
    let remaining = parseFloat(debt.remaining) - paidAmount;
    if (remaining < 0) remaining = 0;

    await Payment.create({
      debt_id: debt.id,
      amount: paidAmount,
      payment_date,
      note,
    });

    let status = 'unpaid';
    if (remaining === 0) status = 'paid';
    else if (remaining < debt.amount) status = 'partial';

    await debt.update({ remaining, status });
    res.redirect('/debts');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal mencatat pembayaran' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Debt.destroy({ where: { id: req.params.id } });
    res.redirect('/debts');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus hutang/piutang' });
  }
};
