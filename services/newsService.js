const parser = require("rss-parser");
const News = require("../models/newsModel");
const { Translate } = require("@google-cloud/translate").v2;
const translate = new Translate();

const newsSources = [
  { url: "https://www.offshore-energy.biz/feed/", category: "Maritime" },
  {
    url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx",
    category: "Upstream",
  },
  {
    url: "https://www.oilandgas360.com/feed/",
    category: "Refining and Downstream",
  },
];

const fetchNews = async () => {
  const parserInstance = new parser();
  let newsArticles = [];

  for (const source of newsSources) {
    try {
      const feed = await parserInstance.parseURL(source.url);

      feed.items.forEach((item) => {
        newsArticles.push({
          title: item.title,
          summary: item.contentSnippet,
          link: item.link,
          category: source.category,
          source: source.url,
          publishedAt: new Date(item.pubDate),
          image:
            item.enclosure?.url ||
            extractImage(item["content:encoded"]) ||
            "https://images.rigzone.com/images/news/articles/USA-EIA-Forecasts-Gasoline-Price-Drop-in-2025-and-2026-179690-582x327.webp",
        });
      });
    } catch (error) {
      console.error(`Error parsing feed from ${source.url}:`, error.message);
    }
  }

  const newTitles = newsArticles.map((article) => article.title);

  await News.deleteMany({ title: { $in: newTitles } });

  await News.insertMany(newsArticles);

  // await News.deleteMany({});
  // await News.insertMany(newsArticles);
  console.log("📰 News updated in the database");
};

const getNews = async (query = {}) => {
  return await News.find(query).sort({ publishedAt: -1 });
};

const translateNews = async (newsArray, targetLang) => {
  const translatedNews = await Promise.all(
    newsArray.map(async (news) => {
      const [translatedTitle] = await translate.translate(
        news.title,
        targetLang
      );
      const [translatedSummary] = await translate.translate(
        news.summary,
        targetLang
      );
      return { ...news, title: translatedTitle, summary: translatedSummary };
    })
  );
  return translatedNews;
};

const extractImage = (htmlContent) => {
  if (!htmlContent) return "";

  const imgRegex = /<img[^>]+src=["'](.*?)["']/i;
  const match = htmlContent.match(imgRegex);

  return match ? match[1] : ""; // Return the image src if found, otherwise an empty string
};

module.exports = { fetchNews, getNews, translateNews };
