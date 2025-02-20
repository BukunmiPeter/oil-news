const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  link: String,
  category: String,
  image: String,
  source: String,
  publishedAt: Date,
});

module.exports = mongoose.model("News", NewsSchema);
