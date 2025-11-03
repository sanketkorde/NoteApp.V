const PORT = 5000;
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const notes = require("./data/notes.data");
require("dotenv").config();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, "public")));


// ✅ Session Setup
app.use(
  session({
    secret: "mysecretkey", 
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// ✅ Single allowed user
const USER = {
  username: "V",
  password: "S@23282207",
};

// ✅ Passport Authentication
passport.use(
  new LocalStrategy((username, password, done) => {
    if (username === USER.username && password === USER.password) {
      return done(null, USER);
    } else {
      return done(null, false, { message: "Invalid Username or Password" });
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser((username, done) => {
  if (username === USER.username) done(null, USER);
  else done(null, false);
});

// ✅ Middleware to protect home page
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/VNotes/login");
}

// ✅ Routes
app.get("/", (req, res) => {
  res.redirect("/VNotes/login");
});

app.get("/VNotes/login", (req, res) => {
  res.render("login", { message: req.flash("error") });
});

app.post(
  "/VNotes/login",
  passport.authenticate("local", {
    failureRedirect: "/VNotes/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/VNotes/home");
  }
);

app.get("/VNotes/home", isLoggedIn, (req, res) => {
  res.render("home", { user: req.user });
});

app.get("/VNotes/notes", isLoggedIn, (req, res) => {
  res.render("notes", {notes, user:req.user});
});


app.post("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/VNotes/login");
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
