require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");

// passport-local doesn't need to be explicit called as a constant and then required. Its used by passport-local-mongoose internally.
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs")
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

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
            username: {
                type: String,
                required: true,
            },
            password: String
    });

    // add passport-local-mongoose as plugin of mongoose.
    userSchema.plugin(passportLocalMongoose);

    const User = mongoose.model("User", userSchema);
    
    // add passport-local-mongoose methods.
    passport.use(User.createStrategy());
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.get("/", (req, res) => {
        res.render("home")
    });

    app.get("/register", (req, res) => {
        
        res.render("register")
    })
    
    app.post("/register", async (req, res) => {
        User.register({username: req.body.username}, req.body.password, async function(err, user) {
            if (err) {
                console.log(err);
                return res.redirect("/register");
            }
            console.log(user);
        });
        // try {

        //     const newUser = new User({username: req.body.username});
        //     await newUser.setPassword(req.body.password);
        //     await newUser.save();
        //     console.log(newUser);
        //     res.redirect("/login")

        // } catch(err) {

        //     console.log(err)
        // }
    })
    
    app.get("/login", (req, res) => {
        res.render("login")
    });

    app.post("/login", passport.authenticate("local", {failureRedirect: "/login"}), function(req, res) {
        res.redirect("/secrets")
    });
    // async (req, res) => {
    //     // try {
    //     //     const {user} = await User.authenticate()(req.body.username, req.body.password);
    //     //     console.log(user)
    //     //     if (user) {
    //     //         passport.authenticate('local', { failureRedirect: '/login' });
    //     //         return res.render("secrets")
    //     //     };
    //     //     if (!user) {return res.redirect("/login")};
    //     // } catch(err) {
    //     //     console.log(err)
    //     // }
    // });

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


