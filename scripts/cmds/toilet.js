const { createCanvas, loadImage } = require('canvas');
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "toilet",
    version: "3.3",
    author: "xalman",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: { en: "{pn} @mention / reply / UID" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const bgUrl = "https://i.imgur.com/AZ5SByA.jpeg";
    let targetID;

    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args.length > 0) {
      targetID = args[0];
    } else {
      targetID = senderID;
    }

    try {
      const [background, avatar] = await Promise.all([
        loadImage(bgUrl),
        loadImage(`https://graph.facebook.com/${targetID}/picture?width=1000&height=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
      ]);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const x = 185;
      const y = 230;
      const size = 80;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();

      const cachePath = path.join(cacheDir, `toilet_${targetID}.png`);
      fs.writeFileSync(cachePath, canvas.toBuffer());

      return api.sendMessage({
        body: "You deserve this place 🤧🔥",
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Error processing image", threadID, messageID);
    }
  }
};
