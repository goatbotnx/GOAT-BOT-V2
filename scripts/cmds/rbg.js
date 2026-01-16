const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

const API_CONFIG_URL = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

module.exports = {
  config: {
    name: "rbg",
    aliases: ["removebg"],
    version: "1.1.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Remove Image Background",
    longDescription: "{pn} reply any image to remove background",
    category: "tools",
    guide: "{pn} reply to an image"
  },

  onStart: async function ({ api, event, message }) {

    if (
      event.type !== "message_reply" ||
      !event.messageReply.attachments ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("⚠️ একটি ছবিতে reply দিয়ে `/rbg` লিখো");
    }

    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const imageUrl = event.messageReply.attachments[0].url;
    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `rbg_${Date.now()}.png`);

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const apiRes = await axios.get(API_CONFIG_URL, { timeout: 10000 });
      const RBG_API = apiRes.data?.rbg;

      if (!RBG_API) {
        throw new Error("RBG API not found in nx-apis.json");
      }

      const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const form = new FormData();
      form.append('image', Buffer.from(img.data), 'image.png');

      const result = await axios.post(`${RBG_API}/process-bg`, form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
        timeout: 120000
      });

      await fs.writeFile(cachePath, Buffer.from(result.data));

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: "✅ Background Removed Successfully!",
        attachment: fs.createReadStream(cachePath)
      });

      setTimeout(() => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, 5000);

    } catch (err) {
      console.error("RBG ERROR:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Background remove করতে ব্যর্থ। API বা Server offline হতে পারে।");
    }
  }
};
