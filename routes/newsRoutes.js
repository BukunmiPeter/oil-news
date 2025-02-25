const express = require("express");
const {
  getAllNews,
  getNewsByKeyword,
  getNewsByCategory,
  translateNewsContent,
  getLatestNews,
} = require("../controllers/newsController");

const router = express.Router();

router.get("/", getAllNews);
router.get("/keyword/:keyword", getNewsByKeyword);
router.get("/category/:category", getNewsByCategory);
router.get("/translate", translateNewsContent);
router.get("/latest", getLatestNews);

module.exports = router;
