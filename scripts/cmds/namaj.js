const axios = require('axios');

module.exports = {
  config: {
    name: "namaj",
    aliases: ["prayer", "namajtime"],
    version: "1.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Get prayer times based on city",
    longDescription: "Get real-time Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for any city.",
    category: "Islamic",
    guide: "{pn} [city_name]"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const city = args.join(" ") || "Dhaka";

    try {
      const res = await axios.get(`http://api.aladhan.com/v1/timingsByCity`, {
        params: {
          city: city,
          country: "Bangladesh",
          method: 1 
        }
      });

      const { timings, date } = res.data.data;

      const infoMsg = `┏━━━━━✦ 🕌 ✦━━━━━┓
    Namaj Timings
┗━━━━━━━━━━━━━━━┛

📍 City: ${city.toUpperCase()}
📅 Date: ${date.readable}
🕋 Hijri: ${date.hijri.date}

━━━━━━━━━━━━━━━━
✨ Fajr    : ${timings.Fajr}
☀️ Sunrise : ${timings.Sunrise}
中午 Dhuhr   : ${timings.Dhuhr}
☁️ Asr     : ${timings.Asr}
🌅 Maghrib : ${timings.Maghrib}
🌙 Isha    : ${timings.Isha}
━━━━━━━━━━━━━━━━

"Perform prayer, for it restrains from shameful and unjust deeds." 🤲`;

      return api.sendMessage(infoMsg, threadID, messageID);

    } catch (error) {
      return api.sendMessage(`❌ Information for '${city}' not found. Please type the city name correctly in English (e.g., !prayer Dhaka)`, threadID, messageID);
    }
  }
};
