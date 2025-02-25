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
  { url: "https://www.oilandgas360.com/feed/", category: "Downstream" },
  { url: "https://www.petroleoenergia.com.br/feed/", category: "Upstream" }, // Brazilian upstream news
  { url: "https://www.brasilenergia.com.br/rss", category: "Downstream" }, // Brazilian downstream news
  { url: "https://www.oilreviewmiddleeast.com/rss", category: "Maritime" }, // Middle East maritime news
  { url: "https://www.offshore-mag.com/rss", category: "Maritime" }, // Offshore magazine
  { url: "https://www.energyvoice.com/feed/", category: "Upstream" }, // Energy Voice
  { url: "https://www.oilfieldtechnology.com/rss", category: "Upstream" }, // Oilfield Technology
  { url: "https://www.worldoil.com/rss", category: "Upstream" }, // World Oil
  { url: "https://www.oilgasmonitor.com/rss", category: "Upstream" }, // Oil & Gas Monitor
  { url: "https://www.oilreviewafrica.com/rss", category: "Upstream" }, // Oil Review Africa
  { url: "https://www.oilgasnews.com/rss", category: "Upstream" }, // Oil & Gas News
  { url: "https://www.oilgasdaily.com/rss", category: "Upstream" }, // Oil & Gas Daily
  { url: "https://www.oilgasjournal.com/rss", category: "Upstream" }, // Oil & Gas Journal
  { url: "https://www.oilgasadvancement.com/rss", category: "Upstream" }, // Oil & Gas Advancement
  { url: "https://www.oilgas360.com/rss", category: "Upstream" }, // Oil & Gas 360
  { url: "https://www.oilfieldnews.com/rss", category: "Upstream" }, // Oilfield News
  { url: "https://www.oilfieldtechnology.com/rss", category: "Upstream" }, // Oilfield Technology
  { url: "https://www.oilreviewasia.com/rss", category: "Upstream" }, // Oil Review Asia
  { url: "https://www.oilreviewasia.com/rss", category: "Upstream" }, // Oil Review Asia
];

const extractSourceName = (url) => {
  try {
    const hostname = new URL(url).hostname;
    const name = hostname.replace("www.", "").split(".")[0];
    return name.replace(/-/g, "");
  } catch (error) {
    console.error(
      `Error extracting source name from URL ${url}:`,
      error.message
    );
    return "unknown";
  }
};

const getDefaultImage = (category) => {
  const images = {
    Upstream:
      "https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    Downstream:
      "https://img.freepik.com/free-photo/portrait-engineers-work-hours-job-site_23-2151589543.jpg?t=st=1740403090~exp=1740406690~hmac=5b94ade4daed969891fc2c6be6532718013ea3429990a90656726e8df33d526d&w=1380",
    Maritime:
      "https://img.freepik.com/free-photo/portrait-engineers-work-hours-job-site_23-2151589568.jpg?t=st=1740401831~exp=1740405431~hmac=e5f5987bfe9c49782bcbfdb5042fd1aa2fb0a007b09df8df6c5fc059f0b00d9a&w=1380",
  };
  return (
    images[category] ||
    "https://img.freepik.com/free-photo/photorealistic-scene-with-warehouse-logistics-operations_23-2151468795.jpg?t=st=1740403326~exp=1740406926~hmac=95d3496bf9b04d4d7e43e827940c53a5055a82a825b8bdc1227b85a17a73a83f&w=740"
  );
};

const fetchNews = async () => {
  const parserInstance = new parser();
  let newsArticles = [];

  for (const source of newsSources) {
    try {
      const feed = await parserInstance.parseURL(source.url);

      feed.items.forEach((item) => {
        // Format the publishedAt date
        const publishedAt = new Date(item.pubDate).toLocaleDateString("en-US");

        newsArticles.push({
          title: item.title,
          summary: item.contentSnippet,
          link: item.link,
          category: source.category,
          source: extractSourceName(source.url),
          publishedAt, // Updated to the formatted date
          image:
            item.enclosure?.url ||
            extractImage(item["content:encoded"]) ||
            getDefaultImage(source.category),
        });
      });
    } catch (error) {
      console.error(`Error parsing feed from ${source.url}:`, error.message);
    }
  }

  const newTitles = newsArticles.map((article) => article.title);

  await News.deleteMany({ title: { $in: newTitles } });

  await News.insertMany(
    newsArticles.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    )
  );

  console.log("📰 News updated in the database");
};

const getLatestNewsService = async (req, res) => {
  try {
    const latestNews = await News.findOne().sort({ publishedAt: -1 });

    if (!latestNews) {
      return res.status(404).json({ message: "No news found" });
    }

    const publishedAt = new Date(latestNews.publishedAt);
    const formattedDate = `${publishedAt.getDate()}/${
      publishedAt.getMonth() + 1
    }/${publishedAt.getFullYear()}`;
    const truncatedTitle =
      latestNews.title.length > 80
        ? latestNews.title.slice(0, 80) + "..."
        : latestNews.title;

    const formattedNews = {
      ...latestNews.toObject(),
      publishedAt: formattedDate,
      title: truncatedTitle,
    };

    res.status(200).json(formattedNews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching latest news", error });
  }
};

const getNews = async (query = {}) => {
  const data = await News.find(query).sort({ publishedAt: -1 });

  const formattedData = data.map((article) => {
    const publishedAt = new Date(article.publishedAt);

    const formattedDate = `${publishedAt.getDate()}/${
      publishedAt.getMonth() + 1
    }/${publishedAt.getFullYear()}`;

    const truncatedTitle =
      article.title.length > 80
        ? article.title.slice(0, 80) + "..."
        : article.title;

    return {
      ...article.toObject(),
      publishedAt: formattedDate,
      title: truncatedTitle,
    };
  });

  // Omit the first news item
  const filteredData = formattedData.slice(1);

  return { data: filteredData };
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

module.exports = { fetchNews, getNews, translateNews, getLatestNewsService };
