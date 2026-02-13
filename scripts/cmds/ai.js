const axios = require("axios");

module.exports = {
  config: {
    name: "ai",
    aliases: ["nxai", "aichat"],
    version: "3.0",
    role: 0,
    author: "xalman",
    description: "any question ask ai",
    category: "ai",
    countDown: 3
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ").trim();

    if (!query) return;

    return await handleAIRequest(api, event, query, []);
  },

  onReply: async function ({ api, event, Reply }) {
    const { body } = event;

    if (!Reply || !Reply.lastAnswer) return;

    const history = Reply.history || [];
    history.push({ role: "assistant", content: Reply.lastAnswer });

    return await handleAIRequest(api, event, body.trim(), history);
  }
};

async function handleAIRequest(api, event, query, history) {
  const { threadID, messageID, senderID } = event;

  try {
    const apiConfig = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
    const baseURL = apiConfig.data.chat;
    const finalURL = baseURL.endsWith("/") ? `${baseURL}aichat` : `${baseURL}/aichat`;

    const res = await axios.post(finalURL, {
      query: query,
      history: history
    });

    const answer = res.data?.result;

    if (!answer) {
      return api.sendMessage("No response from AI server.", threadID, messageID);
    }

    api.sendMessage(answer, threadID, (err, info) => {
      if (err) return;

      if (!global.client) global.client = {};
      if (!global.client.handleReply) global.client.handleReply = [];

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        lastAnswer: answer,
        history: [...history, { role: "user", content: query }]
      });
    }, messageID);

  } catch (error) {
    api.sendMessage("Server is not responding right now.", threadID, messageID);
  }
}
