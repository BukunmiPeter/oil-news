require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const newsRoutes = require("./routes/newsRoutes");
const { fetchNews } = require("./services/newsService");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use("/api/news", newsRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Fetch news initially and set interval for periodic updates
    fetchNews();
    // setInterval(fetchNews, 60 * 60 * 1000); // Fetch news every 1 hour

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle errors like "address already in use"
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Try a different port.`
        );
        process.exit(1);
      } else {
        console.error("❌ Server error:", err);
      }
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

startServer();
