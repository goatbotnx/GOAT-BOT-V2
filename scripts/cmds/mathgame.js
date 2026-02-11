module.exports = {
  config: {
    name: "mathgame",
    aliases: ["math"],
    version: "5.2",
    author: "xalman",
    role: 0,
    category: "game"
  },

  onStart: async function ({ event, args, message, usersData }) {
    const axios = require("axios");
    const uid = event.senderID;
    
    if (!args[0]) {
      return message.reply(
`🧮 MATH GAME GUIDE
────────────
📌 Usage:
➤ /mathgame easy
➤ /mathgame medium
➤ /mathgame hard

🎮 Rules:
• সঠিক উত্তর: +300 Coins, +100 XP
• ভুল উত্তর: -100 Coins

⏱ সময়: 60 সেকেন্ড`
      );
    }

    const level = args[0].toLowerCase();
    if (!["easy", "medium", "hard"].includes(level)) {
      return message.reply(
`⚠️ Invalid Level!

✔ Use only:
• easy
• medium
• hard

Example:
➤ /mathgame easy`
      );
    }

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    const userData = await usersData.get(uid) || {};
    let mathHistory = userData.mathHistory || [];
    mathHistory = mathHistory.filter(t => now - t < ONE_HOUR);

    if (mathHistory.length >= 30) {
      const oldest = mathHistory[0];
      const remainingMs = (oldest + ONE_HOUR) - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      return message.reply(
`⛔ Hourly Limit Reached
────────────
🎮 Played: 30 / 30
⏳ Try again in ${remainingMin} minute(s)`
      );
    }

    mathHistory.push(now);
    await usersData.set(uid, { ...userData, mathHistory });

    try {
      const cfg = await axios.get(
        "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json"
      );
      const baseUrl = cfg.data.math;

      const res = await axios.get(`${baseUrl}/api/game?level=${level}`);
      const { question, answer, options } = res.data;

      const optText = options.map((o, i) => ` ${i + 1}. ${o}`).join("\n");

      const quizMsg =
`🧮 MATH QUIZ (${level.toUpperCase()})
────────────
❓ ${question} = ?

${optText}

⏱ Time: 60 seconds
✏️ Reply 1-4 only`;

      message.reply(quizMsg, (err, info) => {
        if (err) return;

        const timeout = setTimeout(() => {
          message.unsend(info.messageID);
          global.GoatBot.onReply.delete(info.messageID);
        }, 60 * 1000);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "math",
          author: uid,
          correctIndex: options.indexOf(answer) + 1,
          answer,
          quizMsgID: info.messageID,
          timeout
        });
      });

    } catch (e) {
      console.error(e);
      message.reply("⚠️ Failed to load quiz.");
    }
  },

  onReply: async function ({ event, Reply, message, usersData }) {
    const { author, correctIndex, answer, quizMsgID, timeout } = Reply;
    if (event.senderID !== author) return;

    clearTimeout(timeout);

    const userReply = event.body.trim();
    const userData = await usersData.get(author) || {};

    message.unsend(quizMsgID);
    message.unsend(event.messageID);

    if (userReply == correctIndex) {
      await usersData.set(author, {
        ...userData,
        money: (userData.money || 0) + 300,
        exp: (userData.exp || 0) + 100
      });

      message.reply(
`✅ Correct Answer!
🎯 ${answer}
💰 +300 Coins | ⭐ +100 XP`
      );
    } else if (["1","2","3","4"].includes(userReply)) {
      await usersData.set(author, {
        ...userData,
        money: Math.max((userData.money || 0) - 100, 0)
      });

      message.reply(
`❌ Wrong Answer!
✔ Correct: ${answer}
💸 -100 Coins`
      );
    }

    global.GoatBot.onReply.delete(quizMsgID);
  }
};
