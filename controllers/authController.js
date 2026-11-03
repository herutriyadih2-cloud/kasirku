const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.showLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !user.active) {
      return res.render('login', { error: 'Username atau password salah' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.render('login', { error: 'Username atau password salah' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    return res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    return res.render('login', { error: 'Terjadi kesalahan server' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
