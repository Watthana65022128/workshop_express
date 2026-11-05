const mongoose = require("mongoose");
const { satangToBaht } = require("../utils/money");

const orderSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: { type: String, required: true },
    unitPriceSatang: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalSatang: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true },
);

orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, productId: 1, createdAt: -1 });
orderSchema.set("toJSON", {
  transform(_doc, order) {
    order.unitPriceBaht = satangToBaht(order.unitPriceSatang);
    order.totalBaht = satangToBaht(order.totalSatang);
    delete order.unitPriceSatang;
    delete order.totalSatang;
    return order;
  },
});

module.exports = mongoose.model("Order", orderSchema);
