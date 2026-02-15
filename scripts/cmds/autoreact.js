const fs = require("fs-extra");
const path = __dirname + "/cache/autoreact_status.json";

module.exports = {
  config: {
    name: "autoreact",
    version: "2.0",
    author: "xalman",
    countDown: 0,
    role: 0,
    shortDescription: "On/Off auto reaction",
    longDescription: "auto react command on off system",
    category: "system",
    guide: {
      en: "{pn} on | off"
    }
  },

  onChat: async function ({ api, event }) {
    if (!fs.existsSync(path)) fs.writeJsonSync(path, { status: true });
    const { status } = fs.readJsonSync(path);
    
    if (!status || !event.body) return;

    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

    if (emojiRegex.test(event.body)) {
      const emojis = ["❤️", "💖", "🔥", "✨", "🌟", "⚡", "🌈", "🎈", "🎉", "🏆", "💯", "✅", "👑", "💎", "👍", "🙌", "👏", "😆", "🤣", "😂", "😎", "🤩", "🥰", "😍", "😘", "🥳", "😇", "🦋", "🌹", "🌸", "🍀", "🍓", "🍒", "🍕", "🍦", "🍭", "🍷", "🧸", "🎭", "🎨", "🎬", "🎸", "🎧", "🎮", "🎯", "🖤", "🧡", "💛", "💚", "💙"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      api.setMessageReaction(randomEmoji, event.messageID, (err) => {}, true);
    }
  },

  onStart: async function ({ api, event, args }) {
    if (!fs.existsSync(path)) fs.writeJsonSync(path, { status: true });
    const data = fs.readJsonSync(path);

    if (args[0] == "on") {
      data.status = true;
      fs.writeJsonSync(path, data);
      return api.sendMessage("✅ Auto React has been turned ON", event.threadID);
    } else if (args[0] == "off") {
      data.status = false;
      fs.writeJsonSync(path, data);
      return api.sendMessage("❌ Auto React has been turned OFF", event.threadID);
    } else {
      return api.sendMessage(`Use {pn} on to turn on and {pn} off to turn off.`, event.threadID);
    }
  }
};
