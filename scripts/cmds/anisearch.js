const axios = require('axios');

module.exports = {
  config: {
    name: "anisearch",
    aliases: ["as", "animesearch"],
    version: "6.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Sends anime video ",
    longDescription: "Reacts to user's message first, then sends the video and reacts to itself.",
    category: "anime"
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ");
    if (!query) return message.reply("⚠️ Please provide an anime name!");

    try {
      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      const githubRes = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
      const ANIME_API_BASE = githubRes.data.anisearch;

      if (!ANIME_API_BASE) return message.reply("❌ API link not found!");

      const res = await axios.get(`${ANIME_API_BASE}/anisearch?q=${encodeURIComponent(query)}`);
      const results = res.data.results;

      if (!results || results.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return message.reply("❌ No video found!");
      }

      const videoStream = await axios.get(results[0].video_url, { responseType: 'stream' });

      return api.sendMessage({
        attachment: videoStream.data
      }, event.threadID, (err, info) => {
        if (!err) {
          api.setMessageReaction("🏮", info.messageID, (err) => {}, true);
        }
      }, event.messageID);

    } catch (err) {
      api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
      return message.reply("❌ Error occurred!");
    }
  }
};
