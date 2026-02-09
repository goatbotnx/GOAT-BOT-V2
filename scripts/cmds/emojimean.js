const axios = require("axios");

module.exports.config = {
    name: "emojimean",
    version: "3.0",
    author: "xalman",
    countDown: 2,
    role: 0,
    description: "Emoji Meaning",
    category: "utility",
    guide: { bn: "{pn} [emoji]" }
};

module.exports.onStart = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (!args[0]) return api.sendMessage("⚠️ example : /emojimean 🙂", threadID, messageID);

    try {
        api.setMessageReaction("🔍", messageID, () => {}, true);

        const { data } = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
        const BASE_URL = (data.mixmean || data.mixmean).replace(/\/$/, "");

        const res = await axios.get(`${BASE_URL}/mean?emoji=${encodeURIComponent(args[0])}`);
        const { name, mean } = res.data.data;

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(`📌 emoji: ${args[0]}\n✨ name: ${name}\n📖 Meaning: ${mean}\n`, threadID, messageID);
    } catch (e) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ error `, threadID, messageID);
    }
};
