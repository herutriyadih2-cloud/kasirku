function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).render('error', { message: 'Akses ditolak. Hanya admin yang boleh mengakses halaman ini.' });
}

function setUserLocals(req, res, next) {
  res.locals.user = req.session && req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
  } : null;
  next();
}

module.exports = { requireAuth, requireAdmin, setUserLocals };
