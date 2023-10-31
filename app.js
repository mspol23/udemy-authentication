require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser")
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require('mongoose-findorcreate');

// passport-local doesn't need to be explicit called as a constant and then required. Its used by passport-local-mongoose internally.
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs")
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

// add session as middleware.
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false, // true as default is deprecated. See https://www.npmjs.com/package/express-session.

}));

// add passport as middleware of express.
app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));

async function main() {
    
    await mongoose.connect("mongodb://localhost:27017/secretsDB");
    
    const userSchema = new mongoose.Schema({
            username: String,
            googleId: String,
            facebookId: String,
            password: String
    });

    // add passport-local-mongoose as plugin of mongoose.
    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate)

    const User = mongoose.model("User", userSchema);
    
    // add passport-local-mongoose methods.
    passport.use(User.createStrategy());

    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
            cb(null, { id: user.id, username: user.username, name: user.name });
        });
    });
      
    passport.deserializeUser(function(user, cb) {
        process.nextTick(function() {
            return cb(null, user);
        });
    });

    // Login with Google.
    passport.use(new GoogleStrategy({
        clientID: process.env["CLIENT_ID"],
        clientSecret: process.env["CLIENT_SECRET_KEY"],
        callbackURL: "http://localhost:3000/auth/google/secrets",
      },
      function(accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

    // Login with Facebook
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
      },
      function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));
    
    // Routes.
    app.get("/", (req, res) => { res.render("home") });

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

    app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect("/secrets")
    });

    app.get('/auth/facebook',
        passport.authenticate('facebook'));

    app.get('/auth/facebook/secrets',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/secrets');
        });

    app.get("/register", (req, res) => { res.render("register") });
    
    app.post("/register", async (req, res) => {
        User.register({username: req.body.username}, req.body.password, async function(err, user) {
            if (err) {
                console.log(err);
                return res.redirect("/register");
            }
            console.log(user);
        });
    });
    
    app.get("/login", (req, res) => {
        res.render("login")
    });

    app.post("/login", passport.authenticate("local", {failureRedirect: "/login"}), function(req, res) { res.redirect("/secrets") });

    app.get("/secrets", (req, res) => {

        if(req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        };
    });

    app.get("/logout", function(req, res, next) {
        
        req.logout(function(err) {
            if (err) { return next(err); };
            res.redirect("/");
        });
        
    });

}

app.listen(3000, () => {
    console.log("Server is running on port 3000.")
});


