const express = require("express");
const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const respond = require("./utils/respond");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

app.get("/api", (req, res) =>
  respond(res, 200, "OK", { service: "ecommerce-shop-api" }),
);
app.use("/api/v1", authRoutes);
app.use("/api/v1/shops", shopRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
