const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

const PORT = process.env.PORT || 8080;
app.get("", (req, res) => {
  res.send("node.js backend is running");
});

app.get("/login", (req, res) => {
  res.send("user login successful");
});

app.get("/logout", (req, res) => {
  res.send("deployment is working");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
