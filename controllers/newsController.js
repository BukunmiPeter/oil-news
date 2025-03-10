const News = require("../models/newsModel");
const {
  getNews,
  translateNews,
  getLatestNewsService,
} = require("../services/newsService");

const getLatestNews = async (req, res) => {
  try {
    const result = await getLatestNewsService(); // Call the service

    if (result.status === 200) {
      res.status(200).json(result.news); // Send the latest news if successful
    } else {
      res.status(result.status).json({ message: result.message }); // Handle error if no news found or any other error
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching latest news", error });
  }
};
const getAllNews = async (req, res) => {
  try {
    const news = await getNews();

    if (news.data.length > 0) {
      news.data.shift(); // Remove the latest news (first item)
    }

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Error fetching news", error });
  }
};

const getNewsByKeyword = async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const news = await getNews({ title: new RegExp(keyword, "i") });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Error fetching news by keyword", error });
  }
};

const getNewsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const news = await getNews({ category });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Error fetching news by category", error });
  }
};

const translateNewsContent = async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const news = await getNews();
    const translatedNews = await translateNews(news, lang);
    res.json(translatedNews);
  } catch (error) {
    res.status(500).json({ message: "Error translating news", error });
  }
};

module.exports = {
  getAllNews,
  getNewsByKeyword,
  getNewsByCategory,
  translateNewsContent,
  getLatestNews,
};
