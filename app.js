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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
