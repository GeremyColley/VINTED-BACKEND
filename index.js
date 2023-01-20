const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin

const app = express();
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/andromeda-vinted");

cloudinary.config({
  cloud_name: "dw6rfhtj7",
  api_key: "363994899767859",
  api_secret: "UN_eq9HggTbqfrw6BLMwHI-S5Ls",
  secure: true,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This routes doesn't exist" });
});

app.listen(3000, () => {
  console.log("Server started");
});
