// Import d'express
const express = require("express");
// Import de mongoose
const mongoose = require("mongoose");
// import de dotenv
require("dotenv").config();
// import de cors
const cors = require("cors");

const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
  origin: process.env.ORIGIN,
};
const cookieParser = require("cookie-parser");

const cloudinary = require("cloudinary").v2;
// Création du serveur (app = nom de serveur)
const app = express();
// utilisation d'express.json() pour pouvoir récupérer des body dans nos routes
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
// Je me connecte au serveur de BDD, qui tourne sur le localhost 27017, je me connecte à la BDD nommée Garage.
// Si elle n'existe pas, je la crée
mongoose.connect(process.env.MONGODB_URL);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//import des fichiers contenant les routes
const userRoutes = require("./routes/User");
const offerRoutes = require("./routes/Offer");
const paymentRoutes = require("./routes/Payment");

// Je demande à mon serveur d'utiliser les routes que j'ai importées
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
