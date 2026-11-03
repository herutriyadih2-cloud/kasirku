const { Op } = require('sequelize');
const { Product, Category } = require('../models');

exports.index = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      order: [['name', 'ASC']],
    });
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.render('products/index', { products, categories, search: search || '' });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat layanan' });
  }
};

exports.create = async (req, res) => {
  try {
    await Product.create(req.body);
    res.redirect('/products');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal membuat layanan' });
  }
};

exports.update = async (req, res) => {
  try {
    await Product.update(req.body, { where: { id: req.params.id } });
    res.redirect('/products');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal mengupdate layanan' });
  }
};

exports.delete = async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } });
    res.redirect('/products');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus layanan' });
  }
};

exports.apiSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { code: { [Op.iLike]: `%${q}%` } },
        ],
      },
      limit: 10,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.apiByCode = async (req, res) => {
  try {
    const product = await Product.findOne({ where: { code: req.params.code } });
    if (!product) return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
