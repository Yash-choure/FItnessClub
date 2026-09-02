const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Plan = require('../models/Plan');
const { ensureNotAuthenticated } = require('../middlewares/authMiddleware');
const { createMemberForUser } = require('../utils/memberProfile');

router.get('/', ensureNotAuthenticated, async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ durationDays: 1 }).lean();
  res.render('signup', {
    authenticated: req.isAuthenticated(),
    plans,
    form: {},
  });
});

router.post('/', ensureNotAuthenticated, async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phone,
    dob,
    gender,
    address,
    planId,
  } = req.body;

  const plans = await Plan.find({ isActive: true }).sort({ durationDays: 1 }).lean();
  const form = { username, firstName, lastName, email, phone, dob, gender, address, planId };

  const renderError = (message) => {
    req.flash('error', message);
    return res.status(400).render('signup', {
      authenticated: false,
      plans,
      form,
      messages: {
        success: [],
        error: [message],
      },
    });
  };

  if (!username || username.trim().length < 4) {
    return renderError('Username must be at least 4 characters.');
  }
  if (!email) {
    return renderError('Email is required.');
  }
  if (!password || password.length < 6) {
    return renderError('Password must be at least 6 characters.');
  }
  if (password !== confirmPassword) {
    return res.redirect('/');
  }

  try {
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return renderError('An account with this email already exists. Please log in.');
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return renderError('This username is already taken.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim(),
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'member',
    });

    await createMemberForUser(newUser, {
      phone,
      dob,
      gender,
      address,
      allowDefaultPlan: false,
      extendByPlan: false,
      status: 'expired',
    });

    req.login(newUser, (err) => {
      if (err) {
        console.error(err);
        req.flash('success', 'Account created. Please log in and choose a membership.');
        return res.redirect('/login');
      }
      req.flash('success', 'Account created. Choose a membership to add it to your account.');
      res.redirect('/pricing');
    });
  } catch (error) {
    console.error(error);
    return renderError(error.message || 'Could not create account. Try again.');
  }
});

module.exports = router;
