const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

const PORT = process.env.PORT || 8080;
app.get("", (req, res) => {
  res.send("shahid axha bacha ni hy.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
