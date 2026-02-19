const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

const PORT = 3000;
app.get("", (res, req) => {
  req.send("node.js backend is running");
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server run on this ${PORT}`));
