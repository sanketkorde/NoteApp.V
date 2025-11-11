const PORT = process.env.PORT || 5000;
const express = require("express");
const path = require("path");
const fs = require("fs");
const methodOverride = require("method-override");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const notes = require("./data/notes.data");
require("dotenv").config();   // Load .env variables

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ---------------------------
// ✅ Session Setup
// ---------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ---------------------------
// ✅ Cloudinary Setup
// ---------------------------
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------
// ✅ Flash + Passport Setup
// ---------------------------
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------
// ✅ Single allowed user from ENV
// ---------------------------
const USER = {
  username: process.env.LOGIN_USER,
  password: process.env.LOGIN_PASSWORD,
};

// ---------------------------
// ✅ Passport Authentication
// ---------------------------
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

// ---------------------------
// ✅ Middleware to protect routes
// ---------------------------
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/VNotes/login");
}

// ---------------------------
// ✅ Routes
// ---------------------------

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
  res.render("notdone", { user: req.user });
});

app.get("/VNotes/notes", isLoggedIn, (req, res) => {
  res.render("notes", { notes, user: req.user });
});

// Logout
app.post("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/VNotes/login");
  });
});

// Special pages
app.get("/VNotes/special", isLoggedIn, (req, res) => {
  res.render("special", { user: req.user });
});

app.get('/VNotes/special/gallery', isLoggedIn, async (req, res) => {
  try {
    const folderName = 'V'; // You can move this to .env also if needed

    const result = await cloudinary.search
      .expression(`folder:${folderName}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    res.render('gallery', { media: result.resources });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching gallery from Cloudinary.');
  }
});

app.get("/VNotes/special/miss", isLoggedIn, (req, res) => {
  res.render("miss", { user: req.user });
});

app.get("/VNotes/special/text", isLoggedIn, (req, res) => {
  res.render("text", { user: req.user });
});

app.get("/VNotes/special/moments", isLoggedIn, (req, res) => {
  res.render("notdone", { user: req.user });
});

app.get("/VNotes/together", isLoggedIn, (req, res) => {
  res.render("notdone", { user: req.user });
});

app.get("/VNotes/apart", isLoggedIn, (req, res) => {
  res.render("notdone", { user: req.user });
});

app.get("/VNotes/special/message", isLoggedIn, (req, res) => {
  res.render("msg", { user: req.user });
});

app.post("/VNotes/special/message", isLoggedIn, (req, res) => {
  const { message } = req.body;
  console.log("New Message Received:", message);
  res.redirect("/VNotes/special/message/sent");
});

app.get("/VNotes/special/message/sent", isLoggedIn, (req, res) => {
  res.render("msg_sent", { user: req.user });
});

// ---------------------------
// ✅ Start Server
// ---------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
