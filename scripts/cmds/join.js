module.exports = {
  config: {
    name: "join",
    version: "3.5",
    author: "xalman",
    countDown: 10,
    role: 1,
    shortDescription: { en: "Access groups the bot is in." },
    longDescription: { en: "Retrieve a list of all active group chats and join them via index number." },
    category: "owner",
    guide: { en: "{p}{n}" },
  },

  onStart: async function ({ api, event, commandName }) {
    try {
      const threads = await api.getThreadList(75, null, ['INBOX']);
      const activeGroups = threads.filter(t => t.isGroup && t.threadName);

      if (activeGroups.length === 0) {
        return api.sendMessage("Currently, I'm not active in any groups.", event.threadID);
      }

      let groupMenu = "💠 ─── [ GROUP DIRECTORY ] ─── 💠\n\n";
      activeGroups.forEach((item, i) => {
        groupMenu += `📍 ${i + 1}. ${item.threadName}\n`;
        groupMenu += `   🆔 TID: ${item.threadID}\n`;
        groupMenu += `   👥 Members: ${item.participantIDs.length}\n`;
        groupMenu += `────────────────────\n`;
      });
      groupMenu += "\n✨ Reply with the list number to join.";

      return api.sendMessage(groupMenu, event.threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          triggerID: info.messageID,
          sender: event.senderID,
          data: activeGroups
        });
      }, event.messageID);

    } catch (err) {
      return api.sendMessage("❌ System error: Unable to fetch group directory.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { sender, data, triggerID } = Reply;

    if (event.senderID !== sender) return;

    const choice = parseInt(event.body);
    const target = data[choice - 1];

    if (!target) {
      return api.sendMessage(`⚠️ Invalid entry! Please pick a number from the list.`, event.threadID, event.messageID);
    }

    try {
      const threadInfo = await api.getThreadInfo(target.threadID);
      const { participantIDs, threadName, approvalMode } = threadInfo;

      if (participantIDs.includes(event.senderID)) {
        return api.sendMessage(`ℹ️ You're already a member of "${threadName}".`, event.threadID, event.messageID);
      }

      if (participantIDs.length >= 250) {
        return api.sendMessage(`🚫 "${threadName}" is currently full (Limit: 250).`, event.threadID, event.messageID);
      }

      await api.addUserToGroup(event.senderID, target.threadID);

      if (approvalMode === true) {
        api.sendMessage(`⏳ Group approval mode is ON for "${threadName}". Your join request is now pending admin review.`, event.threadID, event.messageID);
      } else {
        api.sendMessage(`✅ Success! I've added you to "${threadName}".`, event.threadID, event.messageID);
      }

    } catch (e) {
      api.sendMessage(`✖️ Error joining "${target.threadName}". This might be due to security settings or high privacy.`, event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(triggerID);
    }
  }
};
