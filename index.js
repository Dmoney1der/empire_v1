const express = require('express');
const bodyParser = require('body-parser');
const Customer = require('./db');

const stripe = require('stripe')('sk_test_51N2yA2GIXgOFBvPTNgJOeEOxF6I3NOl2MzmLRGTIFY3bPAD4SmYa8AnhXvmbmxCopdxhu04fWqrHS4CdUKD8Ri0S0001oIO2fL')
const sgMail = require('@sendgrid/mail');
const { response } = require('express');
const send_grid_api = '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'
const expressStatic = require('express-static');
const path = require('path');

const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
sgMail.setApiKey(send_grid_api)

const app = express();
app.use(express.json());
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));
const User = require("./db");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Serve static files from the "web" folder
app.use(express.static(path.join(__dirname, 'web')));

// Mock users data (replace this with your actual user data retrieval logic)
const admin = User.create[{
    username: 'user1',
    password: 'password1'
}];

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});
// Showing dashboard page
app.get("/dashboard", isLoggedIn, function(req, res) {
    res.sendFile(path.join(__dirname, 'web', 'dashboard.html'));
});
//Showing login form
app.get("/admin", function(req, res) {
    res.sendFile(path.join(__dirname, 'web', 'admin.html'));
});
// Handling user signup
app.post("/register", async(req, res) => {
    const user = await User.create({
        username: req.body.username,
        password: req.body.password
    });

    return res.status(200).json(user);
});
//Handling user login
app.post("/login", async function(req, res) {
    try {
        // check if the user exists
        const user = await User.findOne({ username: req.body.username });
        if (user) {
            //check if password matches
            const result = req.body.password === user.password;
            if (result) {
                res.sendFile(path.join(__dirname, 'web', 'dashboard.html'));
            } else {
                res.status(400).json({ error: "password doesn't match" });
            }
        } else {
            res.status(400).json({ error: "User doesn't exist" });
        }
    } catch (error) {
        res.status(400).json({ error });
    }
});

//Handling user logout 
app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.sendFile(path.join(__dirname, 'web', 'admin.html'));;
}

app.post('/submit', async(req, res) => {
    // Get user input for name, email, and course selection
    const { name, email, course } = req.body;

    // Customize Stripe checkout session based on course selection
    let productName, unitAmount;
    if (course === 'package1') {
        productName = 'Package One';
        unitAmount = 100;
    } else if (course === 'package 2') {
        productName = 'Package 3';
        unitAmount = 200;
    } else if (course === 'package 3') {
        productName = 'package 4 ';
        unitAmount = 200;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: productName,
                },
                unit_amount: unitAmount,
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/',
    });
    // set a cookie with the session ID
    res.cookie('session_id', session.id);
    // Create a new customer object with course selection and enrollment status
    const customer = new Customer({ name, email, course_type: course, enrolled: true });
    try {
        await customer.save();
    } catch (error) {
        console.error(error);
    }

    res.redirect(303, session.url);
});

//this page renders if the payment is a success
app.get('/success', async(req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

    // Fetch the most recent customer from the database
    const customer = await Customer.findOne().sort({ _id: -1 }).exec();

    // The email message to send to the user
    const message = {
        to: customer.email,
        from: 'devontehaye2@gmail.com',
        subject: 'Thank You for Your Purchase!',
        html: `
      <p>Dear ${customer.name},</p>
      <p>Thank you for purchasing the ${customer.course_type} course! We appreciate your business and are excited for you to begin your learning journey.</p>
      <p>Please click the button below to download your course material:</p>
      <a href="https://docs.google.com/document/d/e/2PACX-1vQxofKF7JEc7yrlXBE-OAbWOZH7zQ5uyomfW0UVCxJeCF8QR_IMvLq27c3urm0qxhOhphM6DuNnx78_/pub" download>
        <button>Download Course Material</button>
      </a>
      <p>Here is your receipt:</p>
      <p>Amount: $200</p>
      <p>Order Number: ${session.id}</p>
      <p>Date: ${new Date(session.created * 1000).toLocaleDateString()}</p>
    `,
    };
    sgMail
        .send(message)
        .then((response) => console.log("email sent.............."))
        .catch((error) => console.log(error.message))
        //client view
    res.sendFile(path.join(__dirname, 'web', 'thankyou.html'));
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});