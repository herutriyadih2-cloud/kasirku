require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

const { sequelize, User, Product, Category, Employee } = require('./models');
const bcrypt = require('bcryptjs');
const { setUserLocals, requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const debtRoutes = require('./routes/debts');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/incomes');
const reportRoutes = require('./routes/reports');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'kasir_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 hari
}));

app.use(setUserLocals);

// Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', productRoutes);
app.use('/', categoryRoutes);
app.use('/', transactionRoutes);
app.use('/', customerRoutes);
app.use('/', supplierRoutes);
app.use('/', debtRoutes);
app.use('/', expenseRoutes);
app.use('/', incomeRoutes);
app.use('/', reportRoutes);
app.use('/', employeeRoutes);
app.use('/', attendanceRoutes);

app.get('/printer-settings', requireAuth, (req, res) => {
  res.render('printer-settings', { title: 'Pengaturan Printer' });
});

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.use((req, res) => {
  res.status(404).render('error', { message: 'Halaman tidak ditemukan' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Terjadi kesalahan server' });
});

// Sync database & start server
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database synchronized');
    // Seed default admin if not exists
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await User.create({
        username: 'admin',
        password_hash: await bcrypt.hash('admin123', 10),
        name: 'Administrator',
        role: 'admin',
        active: true,
      });
      console.log('Default admin user created: admin / admin123');
    }

    // Seed sample laundry categories
    const catCount = await Category.count();
    if (catCount === 0) {
      await Category.bulkCreate([
        { name: 'Cuci Kiloan', description: 'Layanan cuci per kilogram' },
        { name: 'Cuci Satuan', description: 'Layanan cuci per item' },
        { name: 'Dry Clean', description: 'Layanan dry clean premium' },
        { name: 'Setrika', description: 'Layanan setrika saja' },
      ]);
      console.log('Default laundry categories created');
    }

    // Seed sample laundry services
    const prodCount = await Product.count();
    if (prodCount === 0) {
      const cats = await Category.findAll();
      const catMap = {};
      cats.forEach(c => catMap[c.name] = c.id);
      await Product.bulkCreate([
        { code: 'CK', name: 'Cuci Kiloan Reguler', category_id: catMap['Cuci Kiloan'], service_type: 'kiloan', purchase_price: 3000, sale_price: 7000, stock: 9999, min_stock: 100, unit: 'kg' },
        { code: 'CKE', name: 'Cuci Kiloan Express', category_id: catMap['Cuci Kiloan'], service_type: 'kiloan', purchase_price: 5000, sale_price: 12000, stock: 9999, min_stock: 100, unit: 'kg' },
        { code: 'CS-BED', name: 'Bed Cover', category_id: catMap['Cuci Satuan'], service_type: 'satuan', purchase_price: 15000, sale_price: 35000, stock: 9999, min_stock: 10, unit: 'pcs' },
        { code: 'CS-SPR', name: 'Sprei', category_id: catMap['Cuci Satuan'], service_type: 'satuan', purchase_price: 10000, sale_price: 25000, stock: 9999, min_stock: 10, unit: 'pcs' },
        { code: 'DC-JAS', name: 'Dry Clean Jas', category_id: catMap['Dry Clean'], service_type: 'satuan', purchase_price: 25000, sale_price: 60000, stock: 9999, min_stock: 5, unit: 'pcs' },
        { code: 'SET', name: 'Setrika per Kg', category_id: catMap['Setrika'], service_type: 'kiloan', purchase_price: 2000, sale_price: 5000, stock: 9999, min_stock: 100, unit: 'kg' },
      ]);
      console.log('Default laundry services created');
    }

    // Seed sample employee
    const empCount = await Employee.count();
    if (empCount === 0) {
      await Employee.create({
        code: 'K001',
        name: 'Budi Karyawan',
        position: 'Kasir',
        salary: 2500000,
        join_date: '2026-01-01',
        status: 'active',
      });
      console.log('Default employee created');
    }
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync database:', err);
  });
