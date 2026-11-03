const { Op } = require('sequelize');
const { Income } = require('../models');

exports.index = async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start && end) {
      where.date = { [Op.between]: [start, end] };
    }
    const incomes = await Income.findAll({ where, order: [['date', 'DESC']] });
    const total = await Income.sum('amount', { where });
    res.render('incomes/index', { incomes, total: total || 0, start: start || '', end: end || '' });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat pemasukan' });
  }
};

exports.create = async (req, res) => {
  try {
    await Income.create(req.body);
    res.redirect('/incomes');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mencatat pemasukan' });
  }
};

exports.update = async (req, res) => {
  try {
    await Income.update(req.body, { where: { id: req.params.id } });
    res.redirect('/incomes');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mengupdate pemasukan' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Income.destroy({ where: { id: req.params.id } });
    res.redirect('/incomes');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus pemasukan' });
  }
};
