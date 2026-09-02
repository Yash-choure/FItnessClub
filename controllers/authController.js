const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_EXPIRY = 8 * 60 * 60;

const createToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'ogmms-dev-secret', { expiresIn: JWT_EXPIRY });

module.exports.login_get = (req, res) =>
  res.render('auth/login', {
    title: 'OGMMS - Secure Login',
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg'),
  });

module.exports.login_post = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials.');

    const token = createToken(user._id, user.role);
    res.cookie('jwt', token, { httpOnly: true, maxAge: JWT_EXPIRY * 1000, sameSite: 'lax' });

    const redirectMap = {
      admin: '/admin/dashboard',
      trainer: '/trainers/dashboard',
      member: '/members/dashboard',
    };
    res.status(200).json({ success: true, redirect: redirectMap[user.role] || '/' });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid username or password. Access denied.' });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  req.flash('success_msg', 'You have been securely logged out.');
  res.redirect('/auth/login');
};

module.exports.createToken = createToken;
