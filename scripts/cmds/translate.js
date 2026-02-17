module.exports = {
  config: {
    name: "translate",
    aliases: ["trans"],
    version: "4.0",
    author: "xalman",
    countDown: 5,
    role: 1,
    category: "utility",
    guide: "{pn} [text] OR reply with {pn} [lang_code]"
  },

  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    const { threadID, messageID, type, messageReply } = event;

    let text, to;

    if (type === "message_reply") {
      text = messageReply.body;
      to = args[0] || "bn";
    } 
    else if (args.length > 0) {
      text = args.join(" ");
      to = "bn"; 
      if (text.includes(" -> ")) {
        const parts = text.split(" -> ");
        text = parts[0].trim();
        to = parts[1].trim();
      }
    } else {
      return api.sendMessage("অনুবাদ করতে কিছু লিখুন বা কোনো মেসেজে রিপ্লাই দিন।", threadID, messageID);
    }

    try {

      const api_res = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/main/nx-apis.json");
      const base_url = api_res.data.trans;
      const res = await axios.get(`${base_url}/translate?text=${encodeURIComponent(text)}&to=${to}`);
      
      if (res.data.status) {
        const { translated, from_lang, to_lang } = res.data;

        const msg = `━━━━━━━━━━━━━\n` +
                    `${translated}\n` +
                    `━━━━━━━━━━━━━\n` +
                    `🌍 ${from_lang.toUpperCase()} ➡️ ${to_lang.toUpperCase()}`;

        return api.sendMessage(msg, threadID, messageID);
      } else {
        throw new Error();
      }
    } catch (error) {
      return api.sendMessage("API error x", threadID, messageID);
    }
  }
};
