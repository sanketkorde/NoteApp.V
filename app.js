require("dotenv").config(); // Load .env first
const express = require("express");
const path = require("path");
const fs = require("fs");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cloudinary = require("cloudinary").v2;
const notes = require("./data/notes.data");

const app = express();

// Render sets PORT automatically
const PORT = process.env.PORT || 5000;

// Required for Render (reverse proxy)
app.set("trust proxy", 1);

// ---------------------------
// ✅ Middleware
// ---------------------------
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serve static files (important for deployment)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------
// ✅ Session Setup
// ---------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Render free tier doesn't support HTTPS on internal server
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ---------------------------
// ✅ Cloudinary Setup
// ---------------------------
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
// ✅ Allowed User from .env
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
    }
    return done(null, false, { message: "Invalid Username or Password" });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser((username, done) => {
  if (username === USER.username) return done(null, USER);
  return done(null, false);
});

// ---------------------------
// ✅ Auth Middleware
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

// ---------------------------
// ✅ Enhanced Login Logging
// ---------------------------
app.post(
  "/VNotes/login",
  (req, res, next) => {
    const { username } = req.body;
    const userAgent = req.headers["user-agent"];
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    console.log(`🟡 LOGIN ATTEMPT — Username: ${username} | Time: ${time} | IP: ${ip} | Device: ${userAgent}`);
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/VNotes/login",
    failureFlash: true,
  }),
  (req, res) => {
    const userAgent = req.headers["user-agent"];
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    console.log(`✅ SUCCESSFUL LOGIN — User: ${req.user.username} | Time: ${time} | IP: ${ip} | Device: ${userAgent}`);

    res.redirect("/VNotes/home");
  }
);

app.get("/VNotes/home", isLoggedIn, (req, res) => {
  res.render("home", { user: req.user });
});

app.get("/VNotes/notes", isLoggedIn, (req, res) => {
  res.render("notdone", { notes, user: req.user });
});

// ---------------------------
// ✅ Logout (Render Safe)
// ---------------------------
app.post("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/VNotes/login");
  });
});

// ---------------------------
// ✅ Special Pages
// ---------------------------
app.get("/VNotes/special", isLoggedIn, (req, res) => {
  res.render("special", { user: req.user });
});

app.get("/VNotes/special/gallery", isLoggedIn, async (req, res) => {
  try {
    const folderName = process.env.CLOUDINARY_FOLDER || "V";

    const result = await cloudinary.search
      .expression(`folder:${folderName}`)
      .sort_by("created_at", "desc")
      .max_results(200)
      .execute();

    res.render("gallery", { media: result.resources });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching gallery from Cloudinary.");
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
  console.log("💬 New Message Received:", message);
  res.redirect("/VNotes/special/message/sent");
});

app.get("/VNotes/special/message/sent", isLoggedIn, (req, res) => {
  res.render("msg_sent", { user: req.user });
});

// ---------------------------
// ✅ Start Server
// ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on Render at port ${PORT}`);
});
