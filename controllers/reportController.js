const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const { Transaction, TransactionItem, Product, Expense, Income } = require('../models');

exports.sales = async (req, res) => {
  try {
    const { start, end } = req.query;
    const s = start ? moment(start).startOf('day').toDate() : moment().startOf('month').toDate();
    const e = end ? moment(end).endOf('day').toDate() : moment().endOf('month').toDate();

    const transactions = await Transaction.findAll({
      where: {
        status: 'paid',
        transaction_date: { [Op.between]: [s, e] },
      },
      order: [['transaction_date', 'ASC']],
    });

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalTransactions = transactions.length;

    res.render('reports/sales', {
      transactions,
      totalSales,
      totalTransactions,
      start: start || moment(s).format('YYYY-MM-DD'),
      end: end || moment(e).format('YYYY-MM-DD'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat laporan penjualan' });
  }
};

exports.profit = async (req, res) => {
  try {
    const { start, end } = req.query;
    const s = start ? moment(start).startOf('day').toDate() : moment().startOf('month').toDate();
    const e = end ? moment(end).endOf('day').toDate() : moment().endOf('month').toDate();

    const items = await TransactionItem.findAll({
      include: [
        {
          model: Transaction,
          where: {
            status: 'paid',
            transaction_date: { [Op.between]: [s, e] },
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

    const expenses = await Expense.sum('amount', { where: { date: { [Op.between]: [moment(s).format('YYYY-MM-DD'), moment(e).format('YYYY-MM-DD')] } } }) || 0;
    const income = await Income.sum('amount', { where: { date: { [Op.between]: [moment(s).format('YYYY-MM-DD'), moment(e).format('YYYY-MM-DD')] } } }) || 0;

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit + parseFloat(income) - parseFloat(expenses);

    res.render('reports/profit', {
      totalRevenue,
      totalCost,
      grossProfit,
      expenses,
      income,
      netProfit,
      start: start || moment(s).format('YYYY-MM-DD'),
      end: end || moment(e).format('YYYY-MM-DD'),
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
