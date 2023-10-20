const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

// import de middleware

const isAuthenticated = require("../middlewares/isAthentificated");
const cloudinary = require("cloudinary").v2; // import de cloudinay
// import de fontions
const convertToBase64 = require("../fonctions/convertToBase64");
//import de modeles
const Offer = require("../models/Offer");

// ajout d'annonces
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const transformedPicture = convertToBase64(req.files.picture); //tranfo de l'image en string pour cloudinary
      // requête a cloudinary pour stocker l'image
      const pic = await cloudinary.uploader.upload(transformedPicture);
      const { marque, taille, condition, couleur, emplacement } = req.body;
      const newOffer = new Offer({
        product_name: req.body.name,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { Marque: marque },
          { Taile: taille },
          { Condition: condition },
          { Couleur: couleur },
          { Emplacement: emplacement },
        ],
        owner: req.user,
        product_image: pic.secure_url,
      });
      await newOffer.save();
      await newOffer.populate("owner", "account");

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
      .sort(sortFilter)
      .limit(5)
      .skip(skip)
      .populate("owner", "account _id");

    // Je regarde combien d'offres corespondent à mes recherches
    const numberOfOffers = await Offer.countDocuments(filter);

    res.json({ count: numberOfOffers, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/offers/:id", async (req, res) => {
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

module.exports = router;
