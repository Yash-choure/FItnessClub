const SITE_PLANS = {
  basic: { name: 'Basic Membership', durationDays: 30, price: 3000, features: ['Full gym access', 'Budget-friendly option'] },
  zumbastic: { name: 'Zumbastic Membership', durationDays: 30, price: 5000, features: ['Basic gym access', '4 weekly Zumba classes'] },
  yogastic: { name: 'Yogastic Membership', durationDays: 30, price: 5000, features: ['Basic gym access', '4 weekly Yoga classes'] },
  elite: { name: 'Elite Membership', durationDays: 30, price: 8000, features: ['Full gym access', 'Unlimited classes'] },
  platinum: { name: 'Platinum Membership', durationDays: 30, price: 12000, features: ['Unlimited access', 'Sauna and steam'] },
  'private-trainer': { name: 'Private Trainer', durationDays: 30, price: 10000, features: ['Full gym access', 'One-on-one training'] },
};

module.exports = { SITE_PLANS };
