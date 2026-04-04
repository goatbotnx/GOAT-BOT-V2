const axios = require("axios");

module.exports = {
  config: {
    name: "unblur",
    version: "2.3",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "unblur any image",
    category: "tools",
    guide: "{pn} [reply to image or paste url]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const API_URL = "https://xalman-apis.vercel.app/api/unblur";

    let imageUrl;

    if (type === "message_reply" && messageReply.attachments[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
    } 
    else if (args[0] && args[0].startsWith("http")) {
      imageUrl = args[0];
    } 
    else {
      return api.sendMessage("Please reply to an image or provide a link!", threadID, messageID);
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const response = await axios.post(API_URL, { url: imageUrl }, { 
        responseType: 'stream', 
        timeout: 600000 
      });

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage({
        body: "✨𝙝𝙚𝙧𝙚 𝙞𝙨 𝙮𝙤𝙪𝙧 𝙪𝙣𝙗𝙡𝙪𝙧 𝙞𝙢𝙖𝙜𝙚✨",
        attachment: response.data
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("✕ API Error!", threadID, messageID);
    }
  }
};
