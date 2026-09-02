const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ensureNotAuthenticated } = require('../middlewares/authMiddleware');
const { createToken } = require('../controllers/authController');

// Handle GET request for the login page
router.get('/', ensureNotAuthenticated, (req, res) => {
  res.render('login', { 
    authenticated: req.isAuthenticated(), 
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    },
  });
});

// Handle POST request for user login
router.post('/', ensureNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', (info && info.message) || 'Incorrect credentials.');
      return res.redirect('/');
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      const token = createToken(user._id, user.role);
      res.cookie('jwt', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: 'lax' });
      if (user.role === 'admin') return res.redirect('/admin/dashboard');
      if (user.role === 'trainer') return res.redirect('/trainers/dashboard');
      return res.redirect('/members/dashboard');
    });
  })(req, res, next);
});

module.exports = router;
