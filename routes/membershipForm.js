const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const Membership = require('../models/memberships');
const { applyMembershipToUser } = require('../utils/applyMembership');
const { SITE_PLANS } = require('../utils/sitePlans');

router.get('/:membershipType', ensureAuthenticated, async (req, res) => {
  try {
    const existingMembership = await Membership.findOne({ user: req.user._id });
    if (existingMembership) {
      return res.redirect('/membershipdetails');
    }

    const membershipType = req.params.membershipType;
    if (!SITE_PLANS[membershipType]) {
      req.flash('error', 'Please choose a valid membership.');
      return res.redirect('/pricing');
    }

    res.render('membershipForm', {
      membershipType,
      authenticated: req.isAuthenticated(),
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pricing');
  }
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const existingMembership = await Membership.findOne({ user: req.user._id });
    if (existingMembership) {
      return res.redirect('/membershipdetails');
    }

    const membershipType = req.body.membershipType;
    if (!SITE_PLANS[membershipType]) {
      req.flash('error', 'Please choose a valid membership.');
      return res.redirect('/pricing');
    }

    await applyMembershipToUser(req.user, req.body);
    req.flash('success', 'Membership added to your account.');
    res.redirect('/membershipdetails');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error submitting membership form');
    res.redirect(`/membershipform/${req.body.membershipType || 'basic'}`);
  }
});

module.exports = router;
