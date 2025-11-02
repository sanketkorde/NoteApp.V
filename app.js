const PORT = 5000;
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const app = express();   // ✅ app is defined here
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
require('dotenv').config();



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


app.get("/",(req,res)=>{
    res.render("login");
})

app.get("/login",(req,res)=>{
    res.render("login");
})


