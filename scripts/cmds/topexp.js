const config = {
  name: "topexp",
  version: "3.6.0",
  author: "Sandip",
  role: 0,
  shortDescription: {
    en: "Top 15 XP leaderboard with UIDs"
  },
  longDescription: {
    en: "Displays the top 15 users ranked by experience points including their IDs."
  },
  category: "group",
  guide: {
    en: "{pn}"
  }
};

async function onStart({ api, message, usersData }) {
  try {
    const allUsers = await usersData.getAll();
    
    const sortedHolders = allUsers
      .filter(u => u.exp && u.exp > 0)
      .sort((a, b) => b.exp - a.exp)
      .slice(0, 15);

    if (sortedHolders.length === 0) {
      return message.reply("Analysis complete: No ranking data available.");
    }

    let leaderboard = "🏆 HIGHEST RANKINGS (TOP 15) 🏆\n";
    leaderboard += "━━━━━━━━━━━━━━━━━━\n\n";

    sortedHolders.forEach((user, index) => {
      const rank = index + 1;
      const idDisplay = user.userID || user.id || "Unknown";
      
      leaderboard += `${rank}. ${user.name}\n🆔 UID: ${idDisplay}\n✨ XP: ${user.exp.toLocaleString()}\n\n`;
    });

    leaderboard += "━━━━━━━━━━━━━━━━━━";
    
    return message.reply(leaderboard);
  } catch (err) {
    return message.reply("An error occurred while generating the leaderboard.");
  }
}

module.exports = {
  config,
  onStart
};
