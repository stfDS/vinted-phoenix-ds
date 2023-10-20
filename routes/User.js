const express = require("express");
const router = express.Router();

const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const resultUserMail = await User.findOne({ email: req.body.email });
    //console.log(resultUser);
    if (resultUserMail !== null) {
      res.json({ message: "An account with this email already exists" });
    } else {
      const saltG = uid2(16);
      const hashG = SHA256(req.body.password + saltG).toString(encBase64);
      const tokenG = uid2(64);

      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          avatar: Object, // nous verrons plus tard comment uploader une image
        },
        newsletter: req.body.newsletter,
        token: tokenG,
        hash: hashG,
        salt: saltG,
      });
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userToLog = await User.findOne({ email: req.body.email });
    console.log(userToLog);
    if (userToLog === null) {
      res.status(401).json({ message: "Unauthorised" });
    } else {
      const hashToLog = SHA256(req.body.password + userToLog.salt).toString(
        encBase64
      );
      if (hashToLog === userToLog.hash) {
        res.json({
          _id: userToLog._id,
          token: userToLog.token,
          account: userToLog.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorised" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
