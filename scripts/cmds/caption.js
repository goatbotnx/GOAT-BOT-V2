const axios = require("axios");

module.exports = {
  config: {
    name: "caption",
    version: "1.5",
    author: "xalman",
    countDown: 2,
    role: 0,
    shortDescription: "Get random captions",
    longDescription: "Fetch captions from various categories",
    category: "fun",
    guide: "{pn} <category>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const category = args[0]?.toLowerCase();
    
    const categories = {
      "love": { icon: "❤️", font: "𝐥𝐨𝐯𝐞" },
      "sad": { icon: "🥺", font: "𝐬𝐚𝐝" },
      "funny": { icon: "🤣", font: "𝐟𝐮𝐧𝐧𝐲" },
      "attitude": { icon: "😎", font: "𝐚𝐭𝐭𝐢𝐭𝐮𝐝𝐞" },
      "islamic": { icon: "🕌", font: "𝐢𝐬𝐥𝐚𝐦𝐢𝐜" }
    };

    if (!category || !categories[category]) {
      let msg = "✨ 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀 ✨\n\n";
      for (const key in categories) {
        msg += `${categories[key].icon} ${categories[key].font}\n`;
      }
      msg += "\nUsage: !caption <category>";
      return api.sendMessage(msg, threadID, messageID);
    }

    try {
      api.setMessageReaction("🔍", messageID, () => {}, true);
      const res = await axios.get(`https://xalman-caption-apix.vercel.app/caption?category=${category}`);
      const caption = res.data.caption;

      const responseMsg = `『 ${category.toUpperCase()} CAPTION 』\n\n${caption}\n\n${categories[category].icon}━━━━━━━✨━━━━━━━${categories[category].icon}`;
      
      return api.sendMessage(responseMsg, threadID, messageID);
    } catch (error) {
      return api.sendMessage("❌ Error fetching caption. Please try again.", threadID, messageID);
    }
  }
};
