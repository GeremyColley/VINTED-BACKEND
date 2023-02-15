const express = require("express");
const fileUpload = require("express-fileupload"); // librairie permettant de gérer la transmission des fichiers
const cloudinary = require("cloudinary").v2; // librairie permettant d'envoyer sur l'API cloudinary. Site permetant de sauvegarder des images
const router = express.Router(); // Librairie gérant le routage des requetes API

const isAuthenticated = require("../middlewares/isAuthenticated"); // Ajout du middleware sécurisant la bonne authentification des utilisateurs
const convertToBase64 = require("../utils/convertToBase64"); // D'un utilitaire de conversion de byte en base 64 
const Offer = require("../models/Offer"); // Importation du modele offer.

// Pour tester : executer une requete en POST depuis http://localhost:4000/offer/publish
// Exemple
// Information à envoyer dans le body de la requete
// {  
//  "title": "Sweet",
//  "description": "Sweet à capuche",
//  "price": "110",
//  "condition": "Neuf",
//  "city": "Bergen",
//  "brand": "Superdry",
//  "size": "M",
//  "color": "Brown"
// }
// Mettre un token d'un utilisateur existant dans le "bearer Token". le "bearer Token" est un champ se trouvant dans le header de la requete
// Sur Postman voir l'onglet authorization > type "bearer Token". cela permetra d'entrée et de sortir du middleware isAuthenticated
router.post("/offer/publish", isAuthenticated, fileUpload(), async (req, res) => { // Chaînage successive de plusieurs middlewares avant l'insertion en base de l'article.
    try {
      console.log(req.user);
      const { title, description, price, condition, city, brand, size, color } = req.body;
      //   console.log(result);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });

      const result = await cloudinary.uploader.upload(convertToBase64(req.files.picture));
      newOffer.product_image = result;
      //console.log("Publish Result " + result);
      //throw "myException";
      await newOffer.save();
      res.json(newOffer);

    } catch (error) {
      res.status(400).json({ message: error.message});
    }
  }
);

// Pour tester executer une requete en post depuis http://localhost:4000/offers
// Exemple
// {  
//  "title": "aurore",
//  "priceMax": "romain.colley@hotmail.fr",
//  "priceMin": false,
//  "password": "azerty"
// }
router.get("/offers", async (req, res) => {
  try {
    // title=pantalon&priceMax=200&priceMin=20&sort=price-asc&page=3

    const { title, priceMin, priceMax, sort, page } = req.query;
    // const title = req.query.title;
    // console.log(title);

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    // console.log(filters);

    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $lte: Number(priceMax) };
      }
    }

    // console.log(filters);

    const sortFilter = {};

    if (sort === "price-asc") {
      sortFilter.product_price = "asc"; // ou 1 ou "ascending"
    } else if (sort === "price-desc") {
      sortFilter.product_price = "desc"; // ou -1 ou "descending"
    }

    // On peut aussi faire ça :

    // if (sort) {
    //   sortFilter.product_price = sort.replace("price-", "");
    // }

    const limit = 5;

    let pageRequired = 1;
    if (page) pageRequired = Number(page);

    //                        0*5   =0  1*5   =5  2*5   =10  3*5   =15
    // 5 résultats par page : 1 skip=0, 2 skip=5, 3 skip=10, 4 skip=15
    // 3 résultats par page : 1 skip=0, 2 skip=3, 3 skip=6, 4 skip=9

    const skip = (pageRequired - 1) * limit;

    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");
    // .select("product_price product_name");

    const count = await Offer.countDocuments(filters);

    const response = {
      count: count,
      offers: offers,
    };

    res.json(response);

    // const results = await Offer.find({
    //   product_name: /vert/i,
    //   product_price: { $gte: 20, $lte: 200 },
    // })
    //   .sort({ product_price: -1 || 1 })
    //   .select("product_name product_price");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Pour tester executer une requete en GET depuis http://localhost:4000/offers/'{mettre l'id de l'article offer.owner.ref}'
router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
