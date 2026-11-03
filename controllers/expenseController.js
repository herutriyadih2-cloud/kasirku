const { Op } = require('sequelize');
const moment = require('moment');
const { Expense } = require('../models');

exports.index = async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start && end) {
      where.date = { [Op.between]: [start, end] };
    }
    const expenses = await Expense.findAll({ where, order: [['date', 'DESC']] });
    const total = await Expense.sum('amount', { where });
    res.render('expenses/index', { expenses, total: total || 0, start: start || '', end: end || '' });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat pengeluaran' });
  }
};

exports.create = async (req, res) => {
  try {
    await Expense.create(req.body);
    res.redirect('/expenses');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mencatat pengeluaran' });
  }
};

exports.update = async (req, res) => {
  try {
    await Expense.update(req.body, { where: { id: req.params.id } });
    res.redirect('/expenses');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mengupdate pengeluaran' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Expense.destroy({ where: { id: req.params.id } });
    res.redirect('/expenses');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus pengeluaran' });
  }
};
