const express = require("express");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const { authenticate, requireApprovedShop } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireApprovedShop);
router.get("/", productController.list);
router.post("/", productController.create);
router.get("/:id", productController.get);
router.put("/:id", productController.update);
router.delete("/:id", productController.remove);
router.get("/:id/orders", orderController.listForProduct);
router.post("/:id/orders", orderController.create);

module.exports = router;
