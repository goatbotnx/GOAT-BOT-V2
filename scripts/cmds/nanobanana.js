const axios = require("axios");

module.exports = {
  config: {
    name: "nanobanana",
    aliases: ["nb"],
    version: "1.0",
    author: "xalman",
    countDown: 10,
    role: 0,
    shortDescription: "Generate images using Nano Banana AI",
    longDescription: "Generate high-quality images from text prompts ",
    category: "ai",
    guide: "{pn} <prompt>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage("Please provide a prompt to generate an image.", threadID, messageID);
    }

    try {
      api.setMessageReaction("🎨", messageID, () => {}, true);
      
      const url = `https://xalman-apis.vercel.app/api/nb?prompt=${encodeURIComponent(prompt)}`;
      
      const response = await axios.get(url, { responseType: "stream" });

      return api.sendMessage({
        body: "𝗡𝗔𝗡𝗢𝗕𝗔𝗡𝗔𝗡𝗔 𝗔𝗜 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗🎨",
        attachment: response.data
      }, threadID, messageID);

    } catch (error) {
      return api.sendMessage("Failed to generate image. Please try again later.", threadID, messageID);
    }
  }
};
