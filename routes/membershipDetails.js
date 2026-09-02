const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const Membership = require('../models/memberships');
const SaunaSession = require('../models/saunaSession');
const Member = require('../models/Member');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Access user details from req.user
    const user = req.user;

    // Find the membership details for the logged-in user
    const membershipDetail = await Membership.find({ user: user._id }).sort({ createdAt: -1 }).exec();
    const gymMember = await Member.findOne({ userId: user._id }).populate('planId').lean();

    // Find all sauna session details for the logged-in user
    const saunaAppointments = await SaunaSession.find({ user: user._id }).sort({ createdAt: -1 }).exec();

    // Set the variable to handle the logic
    const hasMembership = membershipDetail.length > 0;

    // Check if the success message has already been displayed
    const successMessageDisplayed = req.session.successMessageDisplayed || false;

    // If not displayed, set the success message and mark it as displayed
    if (!successMessageDisplayed) {
      req.flash('success', 'Login successful!');
      req.session.successMessageDisplayed = true;
    }

    // Pass the membershipDetails, saunaAppointments, and hasMembership variables to the view
    res.render('membershipdetails', {
      membershipDetail,
      gymMember,
      saunaAppointments,
      hasMembership,
      user,
      authenticated: req.isAuthenticated(),
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
    });
  } catch (error) {
    console.error(error);
    res.render('membershipdetails', {
      user: req.user,
      membershipDetail: [],
      gymMember: null,
      saunaAppointments: [],
      hasMembership: false,
      authenticated: req.isAuthenticated(),
      error: 'Error retrieving membership details and sauna appointments',
    });
  }
});

module.exports = router;
