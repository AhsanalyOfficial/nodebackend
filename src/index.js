const express = require("express");
const app = express();
require("dotenv").config();

const PORT = 3000;
app.get("", (res, req) => {
  req.send("node.js backend is running");
});

app.listen(PORT, () => console.log(`Server run on this ${PORT}`));
