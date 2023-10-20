// Import d'express
const express = require("express");
// Import de mongoose
const mongoose = require("mongoose");
// import de dotenv
require("dotenv").config();
// import de cors
const cors = require("cors");

const cloudinary = require("cloudinary").v2;
// Création du serveur (app = nom de serveur)
const vintedServ = express();
// utilisation d'express.json() pour pouvoir récupérer des body dans nos routes
vintedServ.use(express.json());
vintedServ.use(cors);
// Je me connecte au serveur de BDD, qui tourne sur le localhost 27017, je me connecte à la BDD nommée Garage.
// Si elle n'existe pas, je la crée
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secur: true,
});

//import des fichiers contenant les routes
const userRoutes = require("./routes/User");
const offerRoutes = require("./routes/Offer");

// Je demande à mon serveur d'utiliser les routes que j'ai importées
vintedServ.use(userRoutes);
vintedServ.use(offerRoutes);

vintedServ.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

vintedServ.listen(process.env.PORT, () => {
  console.log("Server started");
});
