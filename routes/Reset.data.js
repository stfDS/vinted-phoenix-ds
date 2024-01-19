const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const products = require("../products.json");

const isAuthenticated = require("../middlewares/isAthentificated");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const User = require("../models/User");

router.post("/reset-offerssssss", fileUpload(), async (req, res) => {
  try {
    const users = await User.find();
    for (let i = 0; i < products.length; i++) {
      const pic = await cloudinary.uploader.upload(
        products[i].product_image.secure_url,
        { folder: "vinted/offers" }
      );

      const newOffer = new Offer({
        product_name: products[i].product_name,
        product_description: products[i].product_description,
        product_price: products[i].product_price,
        product_details: products[i].product_details,
        // créer des ref aléatoires
        owner: users[Math.floor(Math.random() * users.length)],
        product_image: pic.secure_url,
        product_pictures: [],
      });
      let allProduct_pictures = [];
      if (products[i].product_pictures.length) {
        for (let j = 0; j < products[i].product_pictures.length; j++) {
          const multipic = await cloudinary.uploader.upload(
            products[i].product_pictures[j].secure_url,
            { folder: "vinted/offers" }
          );
          allProduct_pictures.push(multipic.secure_url);
        }
      }
      newOffer.product_pictures = allProduct_pictures;

      await newOffer.save();
    }

    res.json({ message: "offers created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
