const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "poli",
        version: "2.0",
        author: "xalman",
        countDown: 8,
        role: 0,
        shortDescription: "Generate Turbo AI Images",
        longDescription: "Generate fast images using Pollinations Turbo model via custom API.",
        category: "AI-IMAGE",
        guide: "{pn} [your prompt]"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const prompt = args.join(" ");

        if (!prompt) {
            return api.sendMessage("✨ 𝖯𝗅𝖾𝖺𝗌𝖾 𝖾𝗇𝗍𝖾𝗋 𝖺 𝗉𝗋𝗈𝗆𝗉𝗍!\n━━━━━━━━━━━━━━━━━━━━\n𝖤𝗑𝖺𝗆𝗉𝗅𝖾: /poli a cybernetic wolf", threadID, messageID);
        }

        api.setMessageReaction("⏳", messageID, (err) => {}, true);
        const startTime = Date.now();

        try {

            const configRes = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
            const apiBase = configRes.data.poli;

            if (!apiBase) throw new Error("Could not find API URL in config");
            const response = await axios.get(`${apiBase}/generate?prompt=${encodeURIComponent(prompt)}`);
            const imageUrl = response.data.image_url;
            const authorName = response.data.author || "xalman";

            if (!imageUrl) throw new Error("Invalid API response: image_url missing");

            const cachePath = path.join(__dirname, 'cache', `poli_${senderID}_${Date.now()}.png`);
            fs.ensureDirSync(path.join(__dirname, 'cache'));
          
            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(cachePath, Buffer.from(imgRes.data, 'binary'));

            const endTime = Date.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

            const msgBody = `✨ 𝗣𝗢𝗟𝗟𝗜𝗡𝗔𝗧𝗜𝗢𝗡𝗦 𝗧𝗨𝗥𝗕𝗢 ✨\n━━━━━━━━━━━━━━━━━━━━\n📝 𝖯𝗋𝗈𝗆𝗉𝗍: ${prompt}\n👤 𝖠𝗎𝗍𝗁𝗈𝗋: ${authorName}\n⏱️ 𝖳𝗂𝗆𝖾 𝖳𝖺𝗄𝖾𝗇: ${timeTaken}𝗌\n━━━━━━━━━━━━━━━━━━━━`;

            api.setMessageReaction("✅", messageID, (err) => {}, true);

            return api.sendMessage({
                body: msgBody,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            }, messageID);

        } catch (error) {
            console.error(error);
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            return api.sendMessage(`⚠️ 𝖦𝖾𝗇𝖾𝗋𝖺𝗍𝗂𝗈𝗇 𝖥𝖺𝗂𝗅𝖾𝖽! ${error.message}`, threadID, messageID);
        }
    }
};
