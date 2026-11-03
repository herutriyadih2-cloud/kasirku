const { Supplier } = require('../models');

exports.index = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
    res.render('suppliers/index', { suppliers });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat supplier' });
  }
};

exports.create = async (req, res) => {
  try {
    await Supplier.create(req.body);
    res.redirect('/suppliers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal membuat supplier' });
  }
};

exports.update = async (req, res) => {
  try {
    await Supplier.update(req.body, { where: { id: req.params.id } });
    res.redirect('/suppliers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mengupdate supplier' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Supplier.destroy({ where: { id: req.params.id } });
    res.redirect('/suppliers');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus supplier' });
  }
};
