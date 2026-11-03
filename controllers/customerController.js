const { Customer } = require('../models');

exports.index = async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    res.render('customers/index', { customers });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat pelanggan' });
  }
};

exports.create = async (req, res) => {
  try {
    await Customer.create(req.body);
    res.redirect('/customers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal membuat pelanggan' });
  }
};

exports.update = async (req, res) => {
  try {
    await Customer.update(req.body, { where: { id: req.params.id } });
    res.redirect('/customers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mengupdate pelanggan' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Customer.destroy({ where: { id: req.params.id } });
    res.redirect('/customers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus pelanggan' });
  }
};
