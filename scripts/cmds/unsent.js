module.exports = {
  config: {
    name: "unsent",
    aliases: ["u", "uns", "un", "r"],
    version: "3.0",
    author: "xalman",
    countDown: 2,
    role: 0,
    shortDescription: "Unsend bot's message ",
    category: "utility"
  },

  onChat: async function ({ api, event }) {
    const { messageReply, body, type } = event;
    const triggers = ["unsent", "u", "uns", "un", "u"];

    if (!triggers.includes(body?.toLowerCase())) return;

    if (type === "message_reply" && messageReply.senderID === api.getCurrentUserID()) {
      try {
        await api.unsendMessage(messageReply.messageID);
      } catch {}
    }
  },

  onStart: async function ({ api, event }) {
    const { messageReply, type } = event;

    if (type === "message_reply" && messageReply?.senderID === api.getCurrentUserID()) {
      try {
        await api.unsendMessage(messageReply.messageID);
      } catch {}
    }
  }
};
