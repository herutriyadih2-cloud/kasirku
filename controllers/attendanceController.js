const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const { Attendance, Employee, User } = require('../models');

const STATUS_LABELS = {
  present: 'Hadir',
  absent: 'Tidak Hadir',
  late: 'Terlambat',
  leave: 'Izin',
  sick: 'Sakit'
};

exports.index = async (req, res) => {
  try {
    const { month, year, employee_id } = req.query;
    const selectedMonth = month ? parseInt(month) : moment().month() + 1;
    const selectedYear = year ? parseInt(year) : moment().year();

    const startDate = moment(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`).startOf('month').format('YYYY-MM-DD');
    const endDate = moment(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

    const where = {
      date: { [Op.between]: [startDate, endDate] }
    };
    if (employee_id) where.employee_id = employee_id;

    const attendances = await Attendance.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'name', 'position'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [['date', 'DESC'], ['check_in', 'DESC']]
    });

    const employees = await Employee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    // Summary per employee
    const summary = {};
    attendances.forEach(a => {
      const id = a.employee_id;
      if (!summary[id]) summary[id] = { name: a.employee.name, position: a.employee.position, counts: { present: 0, absent: 0, late: 0, leave: 0, sick: 0 } };
      summary[id].counts[a.status]++;
    });

    res.render('attendance/index', {
      attendances,
      employees,
      summary,
      month: selectedMonth,
      year: selectedYear,
      employee_id: employee_id || '',
      STATUS_LABELS,
      moment
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat data absensi' });
  }
};

exports.createForm = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    const today = moment().format('YYYY-MM-DD');
    const now = moment().format('HH:mm');
    res.render('attendance/form', {
      employees,
      attendance: null,
      today,
      now,
      STATUS_LABELS,
      moment
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat form absensi' });
  }
};

exports.store = async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, status, note } = req.body;

    // Check if attendance already exists for this employee & date
    const existing = await Attendance.findOne({
      where: { employee_id, date }
    });

    if (existing) {
      await existing.update({
        check_in: check_in || existing.check_in,
        check_out: check_out || existing.check_out,
        status,
        note,
        created_by: req.session.user.id
      });
    } else {
      await Attendance.create({
        employee_id,
        date,
        check_in: check_in || null,
        check_out: check_out || null,
        status,
        note,
        created_by: req.session.user.id
      });
    }

    res.redirect('/attendance');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal menyimpan absensi' });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const date = moment().format('YYYY-MM-DD');
    const check_in = moment().format('HH:mm:ss');

    const [attendance, created] = await Attendance.findOrCreate({
      where: { employee_id, date },
      defaults: {
        check_in,
        status: 'present',
        created_by: req.session.user.id
      }
    });

    if (!created) {
      await attendance.update({ check_in, status: attendance.status || 'present' });
    }

    res.redirect('/attendance');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal check-in' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const date = moment().format('YYYY-MM-DD');
    const check_out = moment().format('HH:mm:ss');

    const attendance = await Attendance.findOne({
      where: { employee_id, date }
    });

    if (attendance) {
      await attendance.update({ check_out });
    } else {
      await Attendance.create({
        employee_id,
        date,
        check_out,
        status: 'present',
        created_by: req.session.user.id
      });
    }

    res.redirect('/attendance');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal check-out' });
  }
};

exports.edit = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }]
    });
    if (!attendance) return res.status(404).render('error', { message: 'Data absensi tidak ditemukan' });

    const employees = await Employee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    res.render('attendance/form', {
      employees,
      attendance,
      today: attendance.date,
      now: moment().format('HH:mm'),
      STATUS_LABELS,
      moment
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal memuat data absensi' });
  }
};

exports.update = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) return res.status(404).render('error', { message: 'Data absensi tidak ditemukan' });

    const { employee_id, date, check_in, check_out, status, note } = req.body;
    await attendance.update({
      employee_id,
      date,
      check_in: check_in || null,
      check_out: check_out || null,
      status,
      note,
      created_by: req.session.user.id
    });

    res.redirect('/attendance');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal mengupdate absensi' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) return res.status(404).render('error', { message: 'Data absensi tidak ditemukan' });
    await attendance.destroy();
    res.redirect('/attendance');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Gagal menghapus absensi' });
  }
};

// API for quick check-in/check-out via AJAX
exports.apiToday = async (req, res) => {
  try {
    const date = moment().format('YYYY-MM-DD');
    const attendances = await Attendance.findAll({
      where: { date },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }],
      order: [['check_in', 'DESC']]
    });
    res.json({ success: true, attendances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
