require('dotenv').config(); // call .env
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption"); // call mongoose-encryption.

const app = express()

app.set("view engine", "ejs")
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

main().catch(err => console.log(err));

async function main() {
    
    await mongoose.connect("mongodb://localhost:27017/secretsDB");
    
    const userSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
            },
            password: {
                type: String,
                required: true,
            }
    });

    // ---- mongoose plugin association with schema, 
    // combined with dotenv variable. ----
    userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]})

    const User = mongoose.model("User", userSchema);
    
    app.get("/", (req, res) => {
        res.render("home")
    });

    app.get("/register", (req, res) => {
        res.render("register")
    })
    
    app.post("/register", async (req, res) => {
        const user = req.body.username;
        const pass = req.body.password;

        const [checkUser] = await User.find({username: user});
        console.log(checkUser);
        
        if (checkUser) {
            return res.render("register", {checkUser: checkUser});
        }
        
        const newUser = new User({
            username: user,
            password: pass
        });
        const saveComplete = await newUser.save()
        console.log(saveComplete) 

        res.redirect("/login");
    })
    
    app.get("/login", (req, res) => {
        res.render("login")
    });

    app.post("/login", async (req, res) => {
        const myUser = req.body.username;
        const myPassword = req.body.password;

        const [callUser] = await User.find({username: myUser});
        console.log(callUser);

        if (callUser) {
            if (callUser.username === myUser) {
                if (callUser.password === myPassword) {
                    res.render("secrets")
                } else {
                    console.log("invalid password")
                };
            } else {
                console.log("Invalid user.")
            };
        } else {
            console.log ("Invalid user.")
        };
    });

}

app.listen(3000, () => {
    console.log("Server is running on port 3000.")
});


