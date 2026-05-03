const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "memevid",
    aliases: ["memevideo"], 
    version: "2.5",
    author: "xalman",
    countDown: 5,
    role: 0,
    description: "Get a random meme video",
    category: "media",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message }) {
    const { messageID } = event;
    const CACHE_DIR = path.join(__dirname, "cache");
    const xalman_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get("https://xalman-apis.vercel.app/api/memevid");
      const videoUrl = res.data.url;

      if (!videoUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("Could not find a video URL.");
      }

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

      const filePath = path.join(CACHE_DIR, `${Date.now()}.mp4`);

      const response = await axios({
        method: 'get',
        url: videoUrl,
        headers: { "User-Agent": xalman_UA },
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        return message.reply({
          body: "Here is your meme!😙",
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath));
      });

      writer.on('error', (err) => {
        throw err;
      });

    } catch (e) {
      console.error(e);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return message.reply("An error occurred while fetching the video.");
    }
  }
};
