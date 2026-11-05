const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    priceSatang: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ shopId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
