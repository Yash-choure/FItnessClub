// logout.js
const express = require('express');
const router = express.Router();

// Logout route
router.get('/', (req, res) => {
  // Clear the session variable
  req.session.successMessageDisplayed = false;
  
  req.logout(() => {
    res.cookie('jwt', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 1, sameSite: 'lax' });
    res.redirect('/');
  });
});

module.exports = router;

