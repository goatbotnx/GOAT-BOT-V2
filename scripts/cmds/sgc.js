module.exports = {
  config: {
    name: "supportgc",
    version: "3.0",
    author: "xalman",
    countDown: 8,
    role: 0,
    shortDescription: { en: "Join official support chat" },
    longDescription: { en: "Allows users to automatically join the bot's official support group." },
    category: "general",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const SUPPORT_TID = "1473334461095677";
    const UID = event.senderID;

    try {
      const gData = await threadsData.get(SUPPORT_TID);
      const isAlreadyIn = gData.members.some(m => m.userID === UID && m.inGroup);

      if (isAlreadyIn) {
        return message.reply("📋 Information: You are already a participant in our Support Group.");
      }

      await api.addUserToGroup(UID, SUPPORT_TID);

      const tInfo = await api.getThreadInfo(SUPPORT_TID);
      
      if (tInfo.approvalMode) {
        return message.reply(`📩 Request Dispatched: Approval mode is enabled in "${tInfo.threadName}". Please wait for an admin to confirm.`);
      }

      return message.reply(`✨ Welcome! You've been successfully integrated into "${tInfo.threadName}". Check your inbox.`);

    } catch (err) {
      return message.reply("🚫 Operation Failed: I couldn't add you. Make sure your profile is public, or send a friend request to the bot and try again.");
    }
  }
};
