const router = require("express").Router();
const { register, login, getMe } = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

router.post("/", register);

router.post("/login", login);

router.get("/getMe", protect, getMe);

module.exports = router;
