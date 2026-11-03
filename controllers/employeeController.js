const { Employee, User } = require('../models');
const bcrypt = require('bcryptjs');

exports.index = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{ model: User, as: 'user', attributes: ['username', 'role'] }],
      order: [['name', 'ASC']],
    });
    res.render('employees/index', { employees });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat karyawan' });
  }
};

exports.create = async (req, res) => {
  try {
    const { code, name, phone, address, position, salary, join_date, username, password, role } = req.body;
    let userId = null;

    if (username && password) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).render('error', { message: 'Username sudah digunakan' });
      }
      const user = await User.create({
        username,
        password_hash: await bcrypt.hash(password, 10),
        name,
        role: role || 'kasir',
        active: true,
      });
      userId = user.id;
    }

    await Employee.create({
      user_id: userId,
      code,
      name,
      phone,
      address,
      position,
      salary,
      join_date,
      status: 'active',
    });

    res.redirect('/employees');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal membuat karyawan' });
  }
};

exports.update = async (req, res) => {
  try {
    await Employee.update(req.body, { where: { id: req.params.id } });
    res.redirect('/employees');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal mengupdate karyawan' });
  }
};

exports.delete = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (employee && employee.user_id) {
      await User.destroy({ where: { id: employee.user_id } });
    }
    await Employee.destroy({ where: { id: req.params.id } });
    res.redirect('/employees');
  } catch (err) {
    res.status(500).render('error', { message: 'Gagal menghapus karyawan' });
  }
};
