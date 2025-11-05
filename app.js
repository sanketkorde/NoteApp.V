const PORT = 5000;
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
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dixxvm3uj',     // your cloud name
  api_key: '513229656191122',
  api_secret: 'nrLRMm0lgPlrpN0EDwykmSqAnyM'
});



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

app.get("/VNotes/special", isLoggedIn, (req, res) => {
  res.render("special", { user: req.user });
});

app.get('/VNotes/special/gallery', async (req, res) => {
  try {
    // Replace with your folder name in Cloudinary
    const folderName = 'V';

    // Fetch all assets (images + videos)
    const result = await cloudinary.search
      .expression(`folder:${folderName}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    // Send to EJS template
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
  res.render("notdone", { user: req.user });
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
app.post("/VNotes/special/message/send", isLoggedIn,(req, res) => {
  const { message } = req.body;

  if (!message.trim()) {
    return res.send("Message cannot be empty.");
  }

  // Create /data directory if not exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  // File to store messages
  const filePath = path.join(dataDir, "messages.json");

  // Read old messages
  let messages = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, "utf-8");
    try {
      messages = JSON.parse(fileData);
    } catch {
      messages = [];
    }
  }

  // Add new message
  const newEntry = {
    message,
    date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  };

  messages.push(newEntry);

  // Save back to file
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), "utf-8");

  // Render confirmation
  res.render("msg_sent", { isLoggedIn, message: newEntry.message, user: req.user});
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
