const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    shopName: { type: String, trim: true, minlength: 2, maxlength: 100 },
    role: { type: String, enum: ["shop", "admin"], required: true },
    status: { type: String, enum: ["pending", "approved"], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Account", accountSchema);
