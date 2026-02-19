const express = require("express");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT;
app.get("", (res, req) => {
  req.send("node.js backend is running");
});

app.listen(PORT || 3000, () => console.log(`Server run on this ${PORT}`));
