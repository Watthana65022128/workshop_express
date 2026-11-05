const express = require("express");
const controller = require("../controllers/shopController");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireAdmin);
router.get("/", controller.listPending);
router.put("/:id/approve", controller.approve);

module.exports = router;
