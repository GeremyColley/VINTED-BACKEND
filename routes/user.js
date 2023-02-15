const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router(); // Librairie gérant le routage des requetes API

const User = require("../models/User");  // Importation du modèle USER

// Pour tester : executer une requete en post depuis http://localhost:4000/user/signup
// Exemple
// {  
//  "username": "aurore",
//  "email": "romain.colley@hotmail.fr",
//  "newsletter": false,
//  "password": "azerty"
// }
router.post("/user/signup", async (req, res) => {
  try {
    console.log(req.body);

    const { username, email, password, newsletter } = req.body;   // Destructuring

    if (!username || !email || !password || typeof newsletter !== "boolean") { 
      return res.status(400).json({ message: "Missing parameter" });
    }
    
    const emailAlreadyUsed = await User.findOne({ email }); // Si l'email est déjà utilisé par quelqu'un d'autre, on renvoie une erreur
    
    if (emailAlreadyUsed) {
      return res.status(409).json({ message: "This email is already used" });
    }
    console.log("Ici3 - begin crypto");
    const token = uid2(64); // création aléatoire du token
    const salt = uid2(16); // création aléatoire du salt
    const hash = SHA256(salt + password).toString(encBase64); // // création hash salt + password
    // Création de l'objet user
    const newUser = new User({
      email,
      account: {
        username,
      },
      newsletter,
      token,
      hash,
      salt,
    });
    await newUser.save(); // Sauvegarde de l'utilisateur
    const response = {
      _id: newUser._id,
      account: newUser.account,
      token: newUser.token,
    };
    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Pour tester : executer une requete en post depuis http://localhost:4000/user/login
// Exemple
// {  
//  "email": "romain.colley@hotmail.fr",
//  "password": "azerty"
// }
router.post("/user/login", async (req, res) => {
  try {

    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newHash = SHA256(user.salt + password).toString(encBase64);  // Recréer un hash à partir du salt du user trouvé et du MDP reçu
    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      _id: user._id,
      account: user.account,
      token: user.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
