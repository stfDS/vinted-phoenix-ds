const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const offers = require("../offers.json");
// import de middleware

const isAuthenticated = require("../middlewares/isAthentificated");
const cloudinary = require("cloudinary").v2; // import de cloudinay
// import de fontions
const convertToBase64 = require("../fonctions/convertToBase64");
//import de modeles
const Offer = require("../models/Offer");
const User = require("../models/User");

// ajout d'annonces
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const transformedPicture = convertToBase64(req.files.picture); //tranfo de l'image en string pour cloudinary
      // requête a cloudinary pour stocker l'image
      const pic = await cloudinary.uploader.upload(transformedPicture, {
        folder: "vinted/offers",
      });
      const {
        size,
        title,
        price,
        description,
        color,
        city,
        condition,
        brand,
        exchange,
      } = req.body;
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
        product_image: pic,
        product_pictures: [pic],
      });
      await newOffer.save();

      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    // Je crée un objet que je donerai en argument au find
    const filter = {};

    // En fonction des queries que je reçois, je vais modifier mon objet filter
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filter.product_price = {
        $gte: priceMin,
      };
    }

    if (priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = priceMax;
      } else {
        filter.product_price = {
          $lte: priceMax,
        };
      }
    }

    const sortFilter = {};

    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    let pageToSend = 1;
    if (page) {
      pageToSend = page;
    }

    // Je calcule skip en fonction du query page que j'ai reçu
    const skip = (pageToSend - 1) * 5;

    // Je vais chercher mes offres
    const offers = await Offer.find(filter)
      .populate("owner", "account _id")
      .sort(sortFilter)

      .skip(skip);

    // Je regarde combien d'offres corespondent à mes recherches
    const numberOfOffers = await Offer.countDocuments(filter);

    res.json({ count: numberOfOffers, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  `/reset-offers/${process.env.RESET}`,
  fileUpload(),
  async (req, res) => {
    try {
      const users = await User.find();
      await Offer.deleteMany({});
      await cloudinary.api.delete_resources_by_prefix("vinted/offers");
      for (let i = 0; i < offers.length; i++) {
        const pic = await cloudinary.uploader.upload(
          offers[i].product_image.secure_url,
          {
            folder: "vinted/offers",
          }
        );

        const newOffer = new Offer({
          product_name: offers[i].product_name,
          product_description: offers[i].product_description,
          product_price: offers[i].product_price,
          product_details: offers[i].product_details,
          owner: users[Math.floor(Math.random() * users.length)],

          product_image: pic,
          product_pictures: [],
        });
        let allProduct_pictures = [];
        if (offers[i].product_pictures.length) {
          for (let j = 0; j < offers[i].product_pictures.length; j++) {
            const multipic = await cloudinary.uploader.upload(
              offers[i].product_pictures[j].secure_url,
              { folder: "vinted/offers" }
            );
            allProduct_pictures.push(multipic);
          }
        }
        newOffer.product_pictures = allProduct_pictures;

        await newOffer.save();
      }

      res.json({ message: "offers created" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
