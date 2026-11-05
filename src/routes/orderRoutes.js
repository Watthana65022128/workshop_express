const express = require("express");
const controller = require("../controllers/orderController");
const { authenticate, requireApprovedShop } = require("../middleware/auth");

const router = express.Router();
router.get("/", authenticate, requireApprovedShop, controller.list);

module.exports = router;
