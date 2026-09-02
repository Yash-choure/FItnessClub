const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

require('dotenv').config();
const dns = require('dns');
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (err) {
    // older Node versions
}

const app = express();
const port = process.env.PORT || 3000;

const path = require('path');
const User = require('./models/user');

app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
const ATLAS_SHARDS = [
    'ac-anof9wz-shard-00-00.rtureth.mongodb.net:27017',
    'ac-anof9wz-shard-00-01.rtureth.mongodb.net:27017',
    'ac-anof9wz-shard-00-02.rtureth.mongodb.net:27017',
].join(',');

function toStandardUri(srvUri) {
    try {
        const parsed = new URL(srvUri);
        const user = decodeURIComponent(parsed.username);
        const pass = decodeURIComponent(parsed.password);
        const dbName = (parsed.pathname || '/').replace(/^\//, '') || 'fitnessclub';
        return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${ATLAS_SHARDS}/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
    } catch (err) {
        return null;
    }
}

async function connect() {
    if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
        console.error('MongoDB Atlas username/password are still placeholders in .env.');
        console.error('Open FitnessClub/.env and replace <db_username> and <db_password> with the Atlas database user.');
        return false;
    }

    const options = {
        dbName: process.env.MONGODB_DB || 'fitnessclub',
        family: 4,
        serverSelectionTimeoutMS: 20000,
    };

    try {
        await mongoose.connect(uri, options);
        console.log('Connected to MongoDB');
        return true;
    } catch (error) {
        if (uri.startsWith('mongodb+srv://') && (error.code === 'ESERVFAIL' || String(error.message).includes('querySrv'))) {
            const fallback = process.env.MONGODB_STANDARD_URI || toStandardUri(uri);
            if (fallback) {
                console.warn('SRV DNS lookup failed. Retrying with a standard Atlas host list...');
                try {
                    await mongoose.connect(fallback, options);
                    console.log('Connected to MongoDB');
                    return true;
                } catch (fallbackError) {
                    console.error(fallbackError);
                    return false;
                }
            }
        }
        console.error(error);
        return false;
    }
}

app.use((req, res, next) => {
    res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error')
    };
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.authenticated = req.isAuthenticated && req.isAuthenticated();
    res.locals.currentUser = req.user || null;
    next();
});


// Passport local strategy setup
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    } catch (error) {
        console.log("not working", error);
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });
  

// Use the Routes
const homeRoute = require('./routes/home');
const aboutRoute = require('./routes/about');
const classesRoute = require('./routes/classes');
const trainersRoute = require('./routes/trainers');
const pricingRoute = require('./routes/pricing');
const contactRoute = require('./routes/contact');
const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
const logoutRoute = require('./routes/logout');
const profileRoute = require('./routes/profile');
const passwordChangeRoute = require('./routes/passwordChange');
const membershipFormRoute = require('./routes/membershipForm');
const membershipDetailsRoute = require('./routes/membershipDetails');
const membershipChangeRoute = require('./routes/membershipChange');
const saunaSessionFormRoute = require('./routes/saunaSessionForm');
const newsLetterRoute = require('./routes/newsletter');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { checkUser } = require('./middlewares/authMiddleware');
const { ensureCsrfToken, verifyCsrf } = require('./middlewares/csrfMiddleware');
const memberPortalRoutes = require('./routes/memberRoutes');
const trainerDashRoutes = require('./routes/trainerDashRoutes');


app.use(checkUser);
app.use(ensureCsrfToken);
app.use(verifyCsrf);
app.use('/', homeRoute);
app.use('/about', aboutRoute);
app.use('/classes', classesRoute);
app.use('/trainers/dashboard', trainerDashRoutes);
app.use('/trainers', trainersRoute);
app.use('/pricing', pricingRoute);
app.use('/contact', contactRoute);
app.use('/login', loginRoute);
app.use('/signup', signupRoute);
app.use('/logout', logoutRoute);
app.use('/profile', profileRoute);
app.use('/passwordchange', passwordChangeRoute);
app.use('/membershipform', membershipFormRoute);
app.use('/membershipdetails', membershipDetailsRoute);
app.use('/membershipchange', membershipChangeRoute);
app.use('/saunasessionform', saunaSessionFormRoute);
app.use('/newsletter', newsLetterRoute);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', paymentRoutes);
app.use('/members', memberPortalRoutes);


//Start the server
if (require.main === module) {
    connect().then(isConnected => {
        if (isConnected) {
            app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            });
        }
    })
}

module.exports = app;