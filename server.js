if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const initializePassport = require("./passport-config");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const pgp = require('pg-promise')();

const db = require('./db/db'); 

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:gre123@localhost:5432/login';

// Initialize the database with the connection string
const connection = pgp(connectionString);

const app = express();

initializePassport(
    passport,
    username => db.oneOrNone('SELECT * FROM "Users" WHERE username = $1', [username]),
    id => db.oneOrNone('SELECT * FROM "Users" WHERE id = $1', [id])
);

app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get('/example', async (req, res) => {
    try {
        const result = await db.any('SELECT * FROM "Users"');
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "https://sisi00si.github.io/web_final/web_4-main/web_assignment_!.html",
    failureRedirect: "/login",
    failureFlash: true
}));

app.post("/login", checkNotAuthenticated, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!user) {
            // Incorrect username or password
            req.flash('error', 'Incorrect username or password');
            res.render("login.ejs", { messages: req.flash() }); // Pass flash messages to the template
            return;
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Successful login
            return res.redirect('/');
        });
    })(req, res, next);
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        // Check if req.body.name is not null before inserting into the database
        if (req.body.name) {
            await db.none('INSERT INTO "Users" (username, password) VALUES($1, $2)', [req.body.name, hashedPassword]);
            res.redirect('/login');
        } else {
            console.error('Error: req.body.name is null or undefined');
            res.status(400).send('Bad Request');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/register');
    }
});
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs");
});

app.delete("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});


function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/");
    }
    next();
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
