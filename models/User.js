const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: { type: String, required: true },
    avatar: Object,
  },
  newsletter: Boolean,
  password: String,
});

module.exports = User;
