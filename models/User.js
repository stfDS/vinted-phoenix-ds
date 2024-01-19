const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: { type: String, required: true },
    avatar: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  newsletter: Boolean,
  password: String,
});

module.exports = User;
