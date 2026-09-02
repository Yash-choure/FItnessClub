const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const Membership = require('../models/memberships');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Find the current membership details for the logged-in user
    const currentMembership = await Membership.findOne({ user: req.user._id});
    const membershipType = currentMembership.membershipType;

    // Check if the user has a current membership
    if (!currentMembership) {
      req.flash('error', 'You do not have a current membership to change.');
      return res.redirect('/membershipform'); // Redirect to the membershipForm page if no current membership found
    }

    res.render('membershipChange', { membershipType, authenticated: req.isAuthenticated() });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error retrieving current membership details');
    res.redirect('/pricing'); // Redirect to the user's profile page or handle it based on your needs
  }
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, email, phone, address, additionalComments, preferredCommunication, startDate, newMembershipType } = req.body;

    // Find the current membership details for the logged-in user
    const currentMembership = await Membership.findOne({ user: req.user._id});

    // Check if the user has a current membership
    if (!currentMembership) {
      return res.redirect('/pricing'); // Redirect to the membershipForm page if no current membership found
    }

    // Create a new membership record with updated information and new membership type
    const newMembership = new Membership({
      user: req.user._id,
      name,
      email,
      phone,
      address,
      preferredCommunication,
      additionalComments,
      membershipType: newMembershipType, // Use the new membership type
      startDate,
      endDate: -1,
    });

    const { applyMembershipToUser } = require('../utils/applyMembership');
    await applyMembershipToUser(req.user, {
      name,
      email,
      phone,
      address,
      additionalComments,
      preferredCommunication,
      startDate,
      membershipType: newMembershipType,
    });
    res.redirect('/membershipdetails');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error creating new membership');
    res.redirect('/membershipchange'); // Redirect to the membershipchange page or handle it based on your needs
  }
});

module.exports = router;
