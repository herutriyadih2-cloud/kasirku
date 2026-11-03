const { Sequelize } = require('sequelize');
const moment = require('moment');
const { Transaction, TransactionItem, Product, Customer, Debt, Expense } = require('../models');

exports.index = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const todaySales = await Transaction.sum('total', {
      where: {
        status: 'paid',
        transaction_date: { [Sequelize.Op.between]: [startOfDay, endOfDay] },
      },
    }) || 0;

    const todayTransactions = await Transaction.count({
      where: {
        status: { [Sequelize.Op.ne]: 'canceled' },
        transaction_date: { [Sequelize.Op.between]: [startOfDay, endOfDay] },
      },
    });

    const readyOrders = await Transaction.count({
      where: { laundry_status: 'ready', status: { [Sequelize.Op.ne]: 'canceled' } },
    });

    const lowStock = await Product.findAll({
      where: { stock: { [Sequelize.Op.lte]: Sequelize.col('min_stock') } },
      order: [['stock', 'ASC']],
      limit: 5,
    });

    const topProducts = await TransactionItem.findAll({
      attributes: [
        'product_id',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_sold'],
      ],
      include: [{ model: Product, as: 'product', attributes: ['name'] }],
      group: ['product_id', 'product.id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('quantity')), 'DESC']],
      limit: 5,
    });

    const totalReceivable = await Debt.sum('remaining', { where: { type: 'receivable' } }) || 0;
    const totalPayable = await Debt.sum('remaining', { where: { type: 'payable' } }) || 0;

    const totalProducts = await Product.count();
    const totalCustomers = await Customer.count();

    res.render('dashboard', {
      todaySales,
      todayTransactions,
      readyOrders,
      lowStock,
      topProducts,
      totalReceivable,
      totalPayable,
      totalProducts,
      totalCustomers,
      today,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat dashboard' });
  }
};
