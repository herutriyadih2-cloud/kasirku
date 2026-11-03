require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
  }
);

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'kasir', 'owner'), defaultValue: 'kasir' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Employee Model
const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  position: { type: DataTypes.STRING(50) },
  salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  join_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, {
  tableName: 'employees',
  timestamps: true,
  underscored: true,
});

// Category Model
const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

// Service/Product Model (for laundry services)
const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'categories', key: 'id' } },
  code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  service_type: { type: DataTypes.ENUM('kiloan', 'satuan'), defaultValue: 'kiloan' },
  purchase_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  sale_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  min_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  unit: { type: DataTypes.STRING(50), defaultValue: 'kg' },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

// Customer Model
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true,
});

// Supplier Model
const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
}, {
  tableName: 'suppliers',
  timestamps: true,
  underscored: true,
});

// Transaction Model (Laundry Order)
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  customer_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' } },
  employee_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
  invoice_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  weight: { type: DataTypes.DECIMAL(8, 2), allowNull: true, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  payment_method: { type: DataTypes.ENUM('cash', 'transfer', 'qris', 'credit'), defaultValue: 'cash' },
  paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  change_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('paid', 'credit', 'canceled'), defaultValue: 'paid' },
  laundry_status: { type: DataTypes.ENUM('received', 'washing', 'ironing', 'ready', 'completed', 'canceled'), defaultValue: 'received' },
  estimated_finish_date: { type: DataTypes.DATEONLY },
  transaction_date: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  note: { type: DataTypes.TEXT },
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
});

// TransactionItem Model
const TransactionItem = sequelize.define('TransactionItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  transaction_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'transactions', key: 'id' } },
  product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
  quantity: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 1 },
  purchase_price_at_time: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  sale_price_at_time: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'transaction_items',
  timestamps: true,
  underscored: true,
});

// Debt Model
const Debt = sequelize.define('Debt', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  transaction_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'transactions', key: 'id' } },
  customer_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' } },
  supplier_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'suppliers', key: 'id' } },
  type: { type: DataTypes.ENUM('receivable', 'payable'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  remaining: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  due_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('unpaid', 'partial', 'paid'), defaultValue: 'unpaid' },
  note: { type: DataTypes.TEXT },
}, {
  tableName: 'debts',
  timestamps: true,
  underscored: true,
});

// Payment Model
const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  debt_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'debts', key: 'id' } },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  payment_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  note: { type: DataTypes.TEXT },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

// Expense Model
const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  category: { type: DataTypes.STRING(100) },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
}, {
  tableName: 'expenses',
  timestamps: true,
  underscored: true,
});

// Income Model
const Income = sequelize.define('Income', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  category: { type: DataTypes.STRING(100) },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
}, {
  tableName: 'incomes',
  timestamps: true,
  underscored: true,
});

// Attendance Model
const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  check_in: { type: DataTypes.TIME },
  check_out: { type: DataTypes.TIME },
  status: { type: DataTypes.ENUM('present', 'absent', 'late', 'leave', 'sick'), defaultValue: 'present' },
  note: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
}, {
  tableName: 'attendances',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['employee_id', 'date'] }
  ]
});

// Associations
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id' });

Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'user_id' });

Transaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Transaction, { foreignKey: 'customer_id' });

Transaction.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(Transaction, { foreignKey: 'employee_id' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id', as: 'items' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });

TransactionItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(TransactionItem, { foreignKey: 'product_id' });

Debt.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Transaction.hasOne(Debt, { foreignKey: 'transaction_id' });

Debt.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Debt, { foreignKey: 'customer_id' });

Debt.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Debt, { foreignKey: 'supplier_id' });

Debt.hasMany(Payment, { foreignKey: 'debt_id', as: 'payments' });
Payment.belongsTo(Debt, { foreignKey: 'debt_id' });

Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Employee, { foreignKey: 'user_id' });

Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(Attendance, { foreignKey: 'employee_id' });

Attendance.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Attendance, { foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  Employee,
  Category,
  Product,
  Customer,
  Supplier,
  Transaction,
  TransactionItem,
  Debt,
  Payment,
  Expense,
  Income,
  Attendance,
};
