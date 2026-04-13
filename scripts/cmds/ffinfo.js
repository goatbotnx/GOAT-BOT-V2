const axios = require("axios");

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["freefireinfo"],
    version: "1.2",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Detailed Free Fire player profile info" },
    category: "game",
    guide: { en: "{pn} <uid>" }
  },

  onStart: async function ({ message, args, event, api }) {
    const uid = args[0];

    if (!uid) {
      return message.reply("⚠️ Please provide a UID! Example: ffinfo 6348433559");
    }

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get(`https://xalman-apis.vercel.app/api/ffinfo`, {
        params: { uid: uid }
      });

      const { status, operator, result } = res.data;

      if (status && result) {
        api.setMessageReaction("✅", event.messageID, () => {}, true);

        const { basicInfo, clanInfo, captainInfo, petInfo, socialInfo, otherInfo } = result;

        let msg = `🎮 𝗙𝗥𝗘𝗘 𝗙𝗜𝗥𝗘 𝗗𝗔𝗧𝗔\n━━━━━━━━━━━━━━━━━━\n`;
        msg += `👤 𝗡𝗮𝗺𝗲: ${basicInfo.name}\n`;
        msg += `🆔 𝗨𝗜𝗗: ${basicInfo.uid}\n`;
        msg += `🆙 𝗟𝗲𝘃𝗲ｌ: ${basicInfo.level} (Exp: ${basicInfo.exp})\n`;
        msg += `🌍 𝗥𝗲𝗴𝗶𝗼𝗻: ${basicInfo.region}\n`;
        msg += `👍 𝗟𝗶𝗸𝗲𝘀: ${basicInfo.likes}\n`;
        msg += `🏆 𝗕𝗥 𝗣𝗼𝗶𝗻𝘁𝘀: ${basicInfo.brRankPoints}\n`;
        msg += `🛡️ 𝗖𝗦 𝗣𝗼𝗶𝗻𝘁𝘀: ${basicInfo.csRankPoints}\n`;
        msg += `🔝 𝗠𝗮𝗫 𝗥𝗮𝗻𝗸: ${basicInfo.maxRank}\n`;
        msg += `🏅 𝗕𝗮𝗱𝗴𝗲𝘀: ${basicInfo.badgeCount}\n`;
        msg += `📅 𝗖𝗿𝗲𝗮𝘁𝗲𝗱: ${basicInfo.createTime}\n`;
        msg += `🕒 𝗟𝗮𝘀𝘁 𝗟𝗼𝗴𝗶𝗻: ${basicInfo.lastLogin}\n`;
        msg += `📦 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${basicInfo.version}\n\n`;
        msg += `🏰 𝗖𝗟𝗔𝗡 𝗗𝗘𝗧𝗔𝗜𝗟𝗦\n`;
        msg += `📝 𝗡𝗮𝗺𝗲: ${clanInfo.clanName}\n`;
        msg += `🆔 𝗜𝗗: ${clanInfo.clanId}\n`;
        msg += `📈 𝗟𝗲𝘃𝗲ｌ: ${clanInfo.clanLevel}\n`;
        msg += `👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${clanInfo.members}/${clanInfo.capacity}\n\n`;
        msg += `👑 𝗖𝗔𝗣𝗧𝗔𝗜𝗡 𝗜𝗡𝗙𝗢\n`;
        msg += `👤 𝗡𝗮𝗺𝗲: ${captainInfo.captainName}\n`;
        msg += `🆔 𝗨𝗜𝗗: ${captainInfo.captainUid}\n`;
        msg += `💎 𝗘𝗹𝗶𝘁𝗲 𝗣𝗮𝘀𝘀: ${captainInfo.hasElitePass ? "Yes ✅" : "No ❌"}\n\n`;
        msg += `🐾 𝗣𝗘𝗧 & 𝗦𝗢𝗖𝗜𝗔𝗟\n`;
        msg += `🐶 𝗣𝗲𝘁: ${petInfo.petName} (Lv. ${petInfo.petLevel})\n`;
        msg += `✨ 𝗘𝘅𝗽: ${petInfo.petExp} | Active: ${petInfo.isSelected ? "Yes" : "No"}\n`;
        msg += `🌐 𝗟𝗮𝗻𝗴: ${socialInfo.language}\n`;
        msg += `📝 𝗕𝗶𝗼: ${socialInfo.signature}\n\n`;
        msg += `📊 𝗔𝗗𝗗𝗜𝗧𝗜𝗢𝗡𝗔𝗟 𝗦𝗧𝗔𝗧𝗦\n`;
        msg += `💯 𝗖𝗿𝗲𝗱𝗶𝘁 𝗦𝗰𝗼𝗿𝗲: ${otherInfo.creditScore}\n`;
        msg += `💎 𝗗𝗶𝗮𝗺𝗼𝗻𝗱 𝗖𝗼𝘀𝘁: n/a \n`;
        msg += `👕 𝗖𝗹𝗼𝘁𝗵𝗲𝘀 𝗘𝗾𝘂𝗶𝗽𝗽𝗲𝗱: ${otherInfo.equippedClothesCount}\n`;
        msg += `━━━━━━━━━━━━━━━━━━\n`;
        msg += `✨ 𝗢𝗽𝗲𝗿𝗮𝘁𝗼𝗿: ${operator}`;

        return message.reply(msg);
      } else {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Error: Could not fetch data from API.");
      }

    } catch (error) {
      api.setMessageReaction("⚠️", event.messageID, () => {}, true);
      return message.reply("❌ API Server Error. Please check your endpoint.");
    }
  }
};
