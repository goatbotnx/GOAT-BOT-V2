const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "3.0",
    author: "xalman",
    countDown: 15,
    role: 0,
    shortDescription: "AI 4K Image Upscaler",
    longDescription: "Reply to any image using the command and get 4k results",
    category: "tools",
    guide: "{pn} reply to an image"
  },

  onStart: async function ({ event, message }) {

    if (
      event.type !== "message_reply" ||
      !event.messageReply.attachments ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("⚠️ please reply any image");
    }

    const imageUrl = event.messageReply.attachments[0].url;

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `upscale_${Date.now()}.png`);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    await message.reply("⏳ Image processing may take 2 minutes.");

    try {
      const apiRes = await axios.get(
        "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/main/nx-apis.json",
        { timeout: 20000 }
      );

      const UPSCALE_API = apiRes.data["4k"];
      if (!UPSCALE_API) {
        return message.reply("❌ api error");
      }

      const res = await axios.post(
        `${UPSCALE_API}/upscale`,
        { imageUrl },
        {
          responseType: "arraybuffer",
          timeout: 240000
        }
      );

      await fs.writeFile(filePath, Buffer.from(res.data));

      await message.reply({
        body: "✅ here is your 4K image",
        attachment: fs.createReadStream(filePath)
      });

      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5000);

    } catch (err) {
      console.error("UPSCALE ERROR:", err);

      let msg = "❌ upscale error";
      if (err.code === "ECONNABORTED") {
        msg = "❌ server timeout";
      } else if (err.response) {
        msg = `❌ API Error: ${err.response.status}`;
      }

      message.reply(msg);
    }
  }
};
