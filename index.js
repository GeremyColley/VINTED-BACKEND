const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
require('dotenv').config();
const app = express();
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/andromeda-vinted");

app.listen(process.env.PORT, () => {
  console.log("Server started");
});

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
  secure: true,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This routes doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
