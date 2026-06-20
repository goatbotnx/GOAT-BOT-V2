const axios = require("axios");

module.exports = {
  config: {
    name: "sing",
    version: "3.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Search or download MP3",
    longDescription: "Search songs and download MP3 from YouTube",
    category: "download",
    guide: "{p}sing <song name> | <youtube link>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    const BASE_URL = "https://xalman-apis.vercel.app/api";

    let query = args.join(" ");

    if (messageReply?.body) {
      const match = messageReply.body.match(/(https?:\/\/[^\s]+)/);

      if (match?.[0]?.includes("youtu")) {
        return downloadAudio(
          api,
          threadID,
          messageID,
          match[0],
          BASE_URL
        );
      }
    }

    if (query && query.includes("youtu")) {
      return downloadAudio(
        api,
        threadID,
        messageID,
        query,
        BASE_URL
      );
    }

    if (!query) {
      return api.sendMessage(
        "❌ Please provide a song name or YouTube link.",
        threadID,
        messageID
      );
    }

    try {
      const { data } = await axios.get(
        `${BASE_URL}/ytsearch?q=${encodeURIComponent(query)}`
      );

      const results = data.results?.slice(0, 5);

      if (!results || results.length === 0) {
        return api.sendMessage(
          "❌ No songs found.",
          threadID,
          messageID
        );
      }

      let msg =
        "🎵 𝗠𝗨𝗦𝗜𝗖 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n" +
        "━━━━━━━━━━━━━━━\n";

      const attachments = [];

      for (let i = 0; i < results.length; i++) {
        const video = results[i];

        msg +=
          `${i + 1}. ${video.title}\n` +
          `⏱️ ${video.duration || "N/A"}\n` +
          `📺 ${video.channel || "Unknown"}\n\n`;

        if (video.thumbnail) {
          try {
            const img = await axios({
              url: video.thumbnail,
              method: "GET",
              responseType: "stream"
            });

            if (img.data)
              attachments.push(img.data);

          } catch {}
        }
      }

      msg +=
        "━━━━━━━━━━━━━━━\n" +
        "📥 Reply with 1-5 to download";

      const form = {
        body: msg
      };

      if (attachments.length > 0)
        form.attachment = attachments;

      return api.sendMessage(
        form,
        threadID,
        (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID,
            results,
            baseUrl: BASE_URL
          });
        },
        messageID
      );

    } catch (err) {
      console.log(err);

      return api.sendMessage(
        "⚠️ Search failed.",
        threadID,
        messageID
      );
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;

    if (senderID !== Reply.author)
      return;

    const index = parseInt(body) - 1;

    if (
      isNaN(index) ||
      index < 0 ||
      index >= Reply.results.length
    ) {
      return api.sendMessage(
        "❌ Invalid choice. Choose 1-5.",
        threadID,
        messageID
      );
    }

    const selected = Reply.results[index];

    try {
      await api.unsendMessage(Reply.messageID);
    } catch {}

    return downloadAudio(
      api,
      threadID,
      messageID,
      selected.url,
      Reply.baseUrl,
      selected.duration
    );
  }
};

async function downloadAudio(
  api,
  threadID,
  messageID,
  url,
  baseUrl,
  duration = "N/A"
) {
  let waitMsg;

  try {
    waitMsg = await api.sendMessage(
      "⏳ Processing Audio...",
      threadID
    );

    const { data } = await axios.get(
      `${baseUrl}/ytmp3?url=${encodeURIComponent(url)}`
    );

    if (!data.success || !data.url) {
      try {
        await api.unsendMessage(waitMsg.messageID);
      } catch {}

      return api.sendMessage(
        "❌This song is more than 25 MB.",
        threadID,
        messageID
      );
    }

    const audio = await axios({
      url: data.url,
      method: "GET",
      responseType: "stream"
    });

    try {
      await api.unsendMessage(waitMsg.messageID);
    } catch {}

    return api.sendMessage(
      {
        body:
          `🎵 ${data.title}\n` +
          `👤 ${data.author || "Unknown"}\n` +
          `⏱️ ${duration}`,
        attachment: audio.data
      },
      threadID,
      messageID
    );

  } catch (err) {
    console.log(err);

    if (waitMsg?.messageID) {
      try {
        await api.unsendMessage(waitMsg.messageID);
      } catch {}
    }

    return api.sendMessage(
      "⚠️ This song is more than 25 MB.",
      threadID,
      messageID
    );
  }
}
