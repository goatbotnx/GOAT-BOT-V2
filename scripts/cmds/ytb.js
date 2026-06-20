const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ytb",
    aliases: ["youtube"],
    version: "6.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "YouTube Audio/Video Downloader",
    longDescription: "Search and download YouTube audio/video",
    category: "media",
    guide: {
      en:
        "{pn} -v <song name>\n" +
        "{pn} -a <song name>\n" +
        "{pn} <youtube link>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
      return api.sendMessage(
`╭──〔 YOUTUBE DOWNLOADER 〕──╮
│
├─ 🎥 ${this.config.name} -v believer
├─ 🎵 ${this.config.name} -a believer
├─ 🔗 ${this.config.name} <youtube link>
│
╰──────────────────╯`,
        threadID,
        messageID
      );
    }

    const input = args.join(" ");

    const ytRegex =
      /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/i;

    if (ytRegex.test(input)) {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      return downloadMedia(
        api,
        threadID,
        messageID,
        input,
        "video"
      );
    }

    let mode = "video";

    if (args[0] === "-a")
      mode = "audio";

    const query =
      args[0].startsWith("-")
        ? args.slice(1).join(" ")
        : args.join(" ");

    if (!query)
      return api.sendMessage(
        "❌ Please enter search query",
        threadID,
        messageID
      );

    api.setMessageReaction("🔍", messageID, () => {}, true);

    try {
      const res = await axios.get(
        `https://xalman-apis.vercel.app/api/ytsearch?q=${encodeURIComponent(query)}`
      );

      if (
        !res.data.status ||
        !res.data.results ||
        !res.data.results.length
      ) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          "❌ No result found",
          threadID,
          messageID
        );
      }

      const results = res.data.results.slice(0, 10);

      let msg =
`╭──〔 SEARCH RESULT 〕──╮
│ 🔎 Query: ${query}
│ 📦 Mode: ${mode.toUpperCase()}
╰──────────────────╯

`;

      for (let i = 0; i < results.length; i++) {
        msg +=
`${i + 1}. ${results[i].title}
⏱ ${results[i].duration}
📺 ${results[i].channel}

`;
      }

      msg += "💬 Reply with a number (1-10)";

      api.sendMessage(
        msg,
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName: this.config.name,
              author: senderID,
              results,
              mode
            }
          );
        },
        messageID
      );

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(
        "❌ Search failed",
        threadID,
        messageID
      );
    }
  },

  onReply: async function ({
    api,
    event,
    Reply
  }) {
    const {
      threadID,
      messageID,
      body,
      senderID
    } = event;

    if (senderID != Reply.author)
      return;

    const num = parseInt(body);

    if (
      isNaN(num) ||
      num < 1 ||
      num > Reply.results.length
    ) {
      return api.sendMessage(
        "❌ Invalid number",
        threadID,
        messageID
      );
    }

    const video =
      Reply.results[num - 1];

    api.setMessageReaction("⏳", messageID, () => {}, true);

    return downloadMedia(
      api,
      threadID,
      messageID,
      video.url,
      Reply.mode
    );
  }
};

async function downloadMedia(
  api,
  threadID,
  messageID,
  url,
  mode
) {
  try {
    const cacheDir = path.join(
      __dirname,
      "cache"
    );

    if (!fs.existsSync(cacheDir))
      fs.mkdirSync(cacheDir, {
        recursive: true
      });

    const apiRes = await axios.get(
      `https://xalman-apis.vercel.app/api/ytdlv2?url=${encodeURIComponent(url)}`
    );

    const data = apiRes.data;

    if (!data.success) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        "❌ Download failed",
        threadID,
        messageID
      );
    }

    const mediaUrl =
      mode === "audio"
        ? data.audio_url
        : data.video_url;

    const ext =
      mode === "audio"
        ? "mp3"
        : "mp4";

    const filePath = path.join(
      cacheDir,
      `${Date.now()}.${ext}`
    );

    const media = await axios({
      url: mediaUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer =
      fs.createWriteStream(filePath);

    media.data.pipe(writer);

    writer.on("finish", async () => {

      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );

      await api.sendMessage(
        {
          body:
`╭──〔 DOWNLOAD COMPLETE 〕──╮
│ 🎵 ${data.title}
│ 📦 ${mode.toUpperCase()}
╰────────────────────╯`,
          attachment:
            fs.createReadStream(filePath)
        },
        threadID
      );

      setTimeout(() => {
        if (fs.existsSync(filePath))
          fs.unlinkSync(filePath);
      }, 5000);
    });

    writer.on("error", () => {
      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );
    });

  } catch (err) {
    console.log(err);

    api.setMessageReaction(
      "❌",
      messageID,
      () => {},
      true
    );

    api.sendMessage(
      "❌ Download failed",
      threadID,
      messageID
    );
  }
}
