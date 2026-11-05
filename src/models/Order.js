const mongoose = require("mongoose");

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
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, productId: 1, createdAt: -1 });
orderSchema.set("toJSON", {
  transform(_doc, order) {
    delete order.__v;
    return order;
  },
});

module.exports = mongoose.model("Order", orderSchema);
