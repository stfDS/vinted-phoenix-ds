const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAthentificated");
const convertToBase64 = require("../fonctions/convertToBase64");
const cloudinary = require("cloudinary").v2;
const { faker } = require("@faker-js/faker");

router.post("/signup", fileUpload(), async (req, res) => {
  try {
    const { email, username, password, newsletter } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "Email already used" });
    }

    const hashPassw = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      account: {
        username,
        avatar: {},
      },
      newsletter,
      password: hashPassw,
    });
    if (req.files.picture) {
      const transformedPicture = convertToBase64(req.files.picture); //tranfo de l'image en string pour cloudinary
      // requête a cloudinary pour stocker l'image
      const pic = await cloudinary.uploader.upload(transformedPicture, {
        folder: "vinted/avatar-users",
      });
      newUser.account.avatar = pic.secure_url;
    }

    await newUser.save();

    res.status(201).json({
      message: "User successfully created",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/refresh", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ ...user._doc, password: undefined });
  } catch (err) {
    res.status(500).json({
      message: "An error has occurred",
      err: err.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Email not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "none",
      secure: process.env.JWT_SECURE_COOKIE,
      maxAge: parseInt(process.env.JWT_EXPIRATION, 10),
    });

    res.status(200).json({ ...user._doc, password: undefined });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while connecting",
      err: err.message,
    });
  }
});

router.delete("/logout", async (req, res) => {
  res.clearCookie("jwt", {
    sameSite: "none",
    secure: process.env.JWT_SECURE_COOKIE,
  });
  res.status(200).json({ message: "Deconnected" });
});

router.post(`/reset-users/${process.env.RESET}`, async (req, res) => {
  const users = await User.find();
  if (users.length > 19) {
    try {
      await User.deleteMany({});
      await cloudinary.api.delete_resources_by_prefix("vinted/avatar-users");
      for (let i = 0; i < 20; i++) {
        const newUser = new User({
          email: faker.internet.email().toLowerCase(),
          account: {
            username: faker.internet.displayName(),
            avatar: faker.image.avatar(),
          },
          password: faker.internet.password(),
        });
        await newUser.save();
      }
      res.status(201).json({
        message: `all users created count : ${(await User.find()).length}`,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(207).json({ message: "Users already reset" });
  }
});

module.exports = router;
