const axios = require("axios");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "4.0",
    author: "xalman",
    countDown: 3,
    role: 0,
    shortDescription: "Upload media to Catbox",
    category: "tools",
    guide: "{pn} [reply to any media]"
  },

  onStart: async function ({ api, event }) {

    const {
      threadID,
      messageID,
      type,
      messageReply
    } = event;

    const API_URL =
      "https://xalman-apis.vercel.app/api/catbox";

    if (
      type !== "message_reply" ||
      !messageReply.attachments ||
      messageReply.attachments.length === 0
    ) {

      return api.sendMessage(
        "Please reply to a media file!",
        threadID,
        messageID
      );
    }

    const attachment =
      messageReply.attachments[0];
    const allowedTypes = [
      "photo",
      "video",
      "audio",
      "animated_image"
    ];

    if (!allowedTypes.includes(attachment.type)) {

      return api.sendMessage(
        "Only Photo, Video, GIF, Audio supported!",
        threadID,
        messageID
      );
    }

    const mediaUrl = attachment.url;

    api.setMessageReaction(
      "⏳",
      messageID,
      () => {},
      true
    );

    try {

      const res = await axios.get(
        `${API_URL}?url=${encodeURIComponent(mediaUrl)}`
      );

      if (!res.data.success) {
        throw new Error(
          res.data.error || "Upload failed"
        );
      }

      const uploadedUrl =
        res.data.data.url;

      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );

      return api.sendMessage(
        uploadedUrl,
        threadID,
        messageID
      );

    } catch (error) {

      console.log(error.message);

      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

      return api.sendMessage(
        "Failed to upload media!",
        threadID,
        messageID
      );
    }
  }
};
