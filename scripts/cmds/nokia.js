const { createCanvas, loadImage } = require('canvas');
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nokia",
    version: "3.2",
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

    const bgUrl = "https://iili.io/qJehE8u.png"; 
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

      const moveRight = 80;   
      const moveDown = 280;    
      const widthSize = 320;   
      const heightSize = 245;  

      ctx.drawImage(avatar, moveRight, moveDown, widthSize, heightSize);

      const cachePath = path.join(cacheDir, `nokia_${targetID}.png`);
      fs.writeFileSync(cachePath, canvas.toBuffer());

      return api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("", threadID, messageID);
    }
  }
};
