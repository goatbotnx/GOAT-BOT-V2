const axios = require('axios');

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt"],
    version: "10.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "TikTok video downloader",
    longDescription: "Provides a list of 5 videos with thumbnails. Reply with 'n' for more.",
    category: "media"
  },

  onStart: async function ({ api, event, args, message }) {
    let query = args.join(" ");
    if (!query) return message.reply("⚠️ Please provide a search keyword! (e.g., /tiktok funny)");

    const isListRequest = query.toLowerCase().endsWith("l");
    if (isListRequest) query = query.replace(/l$/i, "").trim();

    try {
      const githubRes = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
      const TIKTOK_API_BASE = githubRes.data.tikdl;

      const res = await axios.get(`${TIKTOK_API_BASE}/tik?q=${encodeURIComponent(query)}`);
      const results = res.data.results;

      if (!results || results.length === 0) return message.reply("❌ Sorry, no videos were found!");

      if (isListRequest) {
        let thumbs = [];
        let msg = `📱 TikTok Search Results: "${query}" (Page: 1/2)\n━━━━━━━━━━━━━━\n`;
        
        for (let i = 0; i < 5; i++) {
          if (results[i]) {
            msg += `${i + 1}. 🎬 ${results[i].title.substring(0, 35)}...\n👤 Author: ${results[i].author}\n\n`;
            const imgStream = await axios.get(results[i].thumbnail, { responseType: 'stream' });
            thumbs.push(imgStream.data);
          }
        }
        msg += "🔢 Reply with a number to download.\n⏭️ Reply with 'n' for the next page.";

        return api.sendMessage({
          body: msg,
          attachment: thumbs
        }, event.threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            results: results,
            page: 1
          });
        }, event.messageID);
      } else {
        message.reply("⏳ Sending the first video, please wait...");
        const stream = await axios.get(results[0].video_url, { responseType: 'stream' });
        return api.sendMessage({ body: `✅ Title: ${results[0].title}`, attachment: stream.data }, event.threadID, event.messageID);
      }
    } catch (err) {
      console.error(err);
      return message.reply("❌ Server error, please try again later!");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, results, page } = Reply;
    if (event.senderID !== author) return;

    const input = event.body.toLowerCase().trim();

    if (input === "n" || input === "next") {
      if (page === 2) return message.reply("⚠️ This is already the last page!");
      
      message.reply("⏳ Loading the next page...");
      let thumbs = [];
      let msg = `📱 TikTok Search Results (Page: 2/2)\n━━━━━━━━━━━━━━\n`;
      
      for (let i = 5; i < 10; i++) {
        if (results[i]) {
          msg += `${i + 1}. 🎬 ${results[i].title.substring(0, 35)}...\n👤 Author: ${results[i].author}\n\n`;
          const imgStream = await axios.get(results[i].thumbnail, { responseType: 'stream' });
          thumbs.push(imgStream.data);
        }
      }
      msg += "🔢 Reply with a number (6-10) to download.";
      
      return api.sendMessage({
        body: msg,
        attachment: thumbs
      }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          results: results,
          page: 2
        });
      }, event.messageID);
    }

    const choice = parseInt(input);
    if (!isNaN(choice) && choice >= 1 && choice <= results.length) {
      message.reply(`⏳ Sending video #${choice}...`);
      try {
        const stream = await axios.get(results[choice - 1].video_url, { responseType: 'stream' });
        return api.sendMessage({ body: `✅ Title: ${results[choice - 1].title}`, attachment: stream.data }, event.threadID, event.messageID);
      } catch (e) { return message.reply("❌ Error sending the video!"); }
    }
  }
};
