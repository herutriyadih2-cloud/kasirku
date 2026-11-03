const { Category } = require('../models');

exports.index = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.render('categories/index', { categories });
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal memuat kategori' });
  }
};

exports.create = async (req, res) => {
  try {
    await Category.create(req.body);
    res.redirect('/categories');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal membuat kategori' });
  }
};

exports.update = async (req, res) => {
  try {
    await Category.update(req.body, { where: { id: req.params.id } });
    res.redirect('/categories');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal mengupdate kategori' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.redirect('/categories');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus kategori' });
  }
};
