const axios = require("axios");

module.exports = {
  config: {
    name: "imgbb",
    aliases: ["ibb", "i"],
    version: "2.3",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Upload image/gif to ImgBB",
    category: "tools",
    guide: "{pn} [reply to image/gif]"
  },

  onStart: async function ({ api, event }) {

    const {
      threadID,
      messageID,
      type,
      messageReply
    } = event;

    let fileUrl;

    if (
      type === "message_reply" &&
      messageReply.attachments[0]
    ) {

      const attachment = messageReply.attachments[0];

      if (
        attachment.type !== "photo" &&
        attachment.type !== "animated_image"
      ) {
        return api.sendMessage(
          "Please reply to an image or gif!",
          threadID,
          messageID
        );
      }

      fileUrl = attachment.url;

    } else {

      return api.sendMessage(
        "Please reply to an image or gif!",
        threadID,
        messageID
      );
    }

    const waitMsg = await api.sendMessage(
      "Uploading...",
      threadID,
      messageID
    );

    try {

      const res = await axios.get(
        `https://xalman-apis.vercel.app/api/ibb?image=${encodeURIComponent(fileUrl)}`
      );

      const data = res.data;

      if (!data.status) {
        throw new Error("Upload failed");
      }

      return api.editMessage(
        data.data.display_url,
        waitMsg.messageID
      );

    } catch (err) {

      return api.editMessage(
        "Failed to upload!",
        waitMsg.messageID
      );
    }
  }
};
