const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "emojimix",
	aliases: ["mix"],
    version: "3.0",
    author: "xalman",
    countDown: 2,
    role: 0,
    description: "Emoji Mix with Reaction and Direct API",
    category: "entertainment",
    guide: { bn: "{pn} [emoji1] [emoji2]" }
};

module.exports.onStart = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (args.length < 2) return api.sendMessage("⚠️ ২টি ইমোজি দিন!", threadID, messageID);

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);

        const url = `https://emojik.vercel.app/s/${encodeURIComponent(args[0])}_${encodeURIComponent(args[1])}?size=256`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        
        if (res.data.length < 3000) { 
            throw new Error("Not Found");
        }

        const cachePath = path.join(__dirname, "cache", `mix_${Date.now()}.png`);
        if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });
        
        fs.writeFileSync(cachePath, Buffer.from(res.data, "utf-8"));

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage({
            body: `✨ Mix Success: ${args[0]} + ${args[1]}`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ It is not possible to mix these two emojis.।", threadID, messageID);
    }
};
