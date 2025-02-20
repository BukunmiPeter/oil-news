const express = require("express");
const {
  getAllNews,
  getNewsByKeyword,
  getNewsByCategory,
  translateNewsContent,
} = require("../controllers/newsController");

const router = express.Router();

router.get("/", getAllNews);
router.get("/keyword/:keyword", getNewsByKeyword);
router.get("/category/:category", getNewsByCategory);
router.get("/translate", translateNewsContent);

module.exports = router;
