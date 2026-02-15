const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nokia",
    aliases: ["nok"],
    version: "14.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    category: "fun",
    description: "Nokia style profile"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const bgUrl = "https://iili.io/qJehE8u.png";
    let targetID = senderID;

    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0] && !isNaN(args[0])) {
      targetID = args[0];
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const [background, avatar] = await Promise.all([
        loadImage(bgUrl),
        loadImage(`https://graph.facebook.com/${targetID}/picture?width=1000&height=1000`)
      ]);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      const x = 80;
      const y = 280;
      const width = 320;
      const height = 245;

      ctx.drawImage(avatar, x, y, width, height);

      const filePath = path.join(cacheDir, `nokia_${targetID}_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      await api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("Error generating image.", threadID, messageID);
    }
  }
};
