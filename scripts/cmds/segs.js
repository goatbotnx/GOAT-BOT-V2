const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "segs",
    aliases: ["xn", "xnxx"],
    version: "4.5",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Search and download videos",
    category: "nsfw",
    guide: "{pn} [query]"
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    const query = args.join(" ");

    if (!query) return message.reply("❌ | Please provide a search query!");

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get(`https://xalman-apis.vercel.app/api/xnxxsearch?q=${encodeURIComponent(query)}`);
      const results = res.data.results.slice(0, 5);

      if (!results || results.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("❌ | No results found!");
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const attachments = [];
      let msg = `🔎 Search Results for: ${query}\n━━━━━━━━━━━━━━━━━━━━\n`;

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        msg += `${i + 1}. ${video.title}\n\n`;

        const imgPath = path.join(cacheDir, `thumb_${senderID}_${i}.jpg`);
        try {
          const imgRes = await axios.get(video.thumbnail, { responseType: "arraybuffer" });
          fs.writeFileSync(imgPath, Buffer.from(imgRes.data, "binary"));
          attachments.push(fs.createReadStream(imgPath));
        } catch (e) {
          console.error("Thumbnail download failed");
        }
      }

      msg += `━━━━━━━━━━━━━━━━━━━━\nReply with 1-5 to select and download.`;

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage({ body: msg, attachment: attachments }, threadID, (err, info) => {
        attachments.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
        
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          results: results,
          listMessageID: info.messageID
        });
      }, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("❌ | API Error!");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, results, listMessageID } = Reply;
    if (event.senderID !== author) return;

    const index = parseInt(event.body) - 1;
    if (isNaN(index) || index < 0 || index >= results.length) return;

    const selected = results[index];
    const videoUrl = selected.download_url;

    if (!videoUrl || videoUrl.includes("Feature coming soon")) {
      return message.reply("❌ | Download link not available for this video.");
    }

    try {
      api.unsendMessage(listMessageID);
      
      api.setMessageReaction("📥", event.messageID, () => {}, true);
      
      const vidRes = await axios.get(videoUrl, { 
        responseType: "stream",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });
      
      return api.sendMessage({
        body: `✅ | Title: ${selected.title}`,
        attachment: vidRes.data
      }, event.threadID, (err) => {
          if (err) return message.reply("❌ | Video file is too large or link expired.");
      }, event.messageID);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ | Failed to fetch video file.");
    }
  }
};
