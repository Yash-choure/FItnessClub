const crypto = require('crypto');

function ensureCsrfToken(req, res, next) {
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
  } else {
    res.locals.csrfToken = '';
  }
  next();
}

function verifyCsrf(req, res, next) {
  const method = req.method;
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }
  const path = req.originalUrl || req.path || '';
  if (!path.startsWith('/admin') && !path.startsWith('/payments')) {
    return next();
  }
  const contentType = req.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  const token = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (!req.session || !token || token !== req.session.csrfToken) {
    req.flash('error_msg', 'Invalid or missing CSRF token. Please retry the form.');
    return res.redirect(req.get('Referrer') || '/admin/dashboard');
  }
  next();
}

module.exports = { ensureCsrfToken, verifyCsrf };
