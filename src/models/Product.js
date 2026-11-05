const mongoose = require("mongoose");
const { toMinorUnits } = require("../utils/money");

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
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: (value) => {
        try {
          toMinorUnits(value);
          return true;
        } catch {
          return false;
        }
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ shopId: 1, isActive: 1, createdAt: -1 });
productSchema.set("toJSON", {
  transform(_doc, product) {
    delete product.__v;
    return product;
  },
});

module.exports = mongoose.model("Product", productSchema);
