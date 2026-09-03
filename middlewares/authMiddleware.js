const jwt = require('jsonwebtoken');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
    return next();
    }
    res.redirect('/login');
}

function ensureNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
    return next();
    }
    if (req.user && req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/profile');
}

const requireAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = req.cookies && req.cookies.jwt;

    if (!token) {
      req.flash('error_msg', 'Please log in to access this resource.');
      return res.redirect('/auth/login');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'ogmms-dev-secret', (err, decodedToken) => {
      if (err) {
        res.cookie('jwt', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 1, sameSite: 'lax' });
        return res.redirect('/auth/login');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decodedToken.role)) {
        console.warn(`Privilege escalation blocked: user ${decodedToken.id} role=${decodedToken.role} path=${req.originalUrl}`);
        return res.status(403).render('error', {
          title: '403 Forbidden',
          message: 'Insufficient privileges to access this resource.',
        });
      }

      req.userJwt = decodedToken;
      next();
    });
  };
};

const checkUser = (req, res, next) => {
  const token = req.cookies && req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'ogmms-dev-secret', (err, decoded) => {
      res.locals.user = err ? null : decoded;
      next();
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { ensureAuthenticated, ensureNotAuthenticated, requireAuth, checkUser };
