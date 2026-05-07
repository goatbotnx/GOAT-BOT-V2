const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    version: "1.0",
    author: "xalman",
    role: 0,
    countDown: 5,
    shortDescription: "Cute romantic pair system",
    category: "love"
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;

    try {
      const loading = await api.sendMessage("💗 | Finding your perfect partner...", threadID);

      const [senderData, threadInfo] = await Promise.all([
        usersData.get(senderID),
        api.getThreadInfo(threadID)
      ]);

      const senderName = senderData.name || "User";
      const senderGender = senderData.gender;

      const members = threadInfo.participantIDs.filter(uid => uid != senderID);
      const targetGender = senderGender === 1 ? 2 : 1;

      let partnerList = [];

      const randomMembers = members.sort(() => 0.5 - Math.random()).slice(0, 50);

      for (const uid of randomMembers) {
        try {
          const data = await usersData.get(uid);
          if (data && data.gender === targetGender) {
            partnerList.push({ id: uid, name: data.name });
          }
        } catch {}
      }

      const partner = partnerList[Math.floor(Math.random() * partnerList.length)] || {
        id: members[Math.floor(Math.random() * members.length)],
        name: "Someone Special"
      };

      const match = Math.floor(Math.random() * 31) + 70;

      const canvas = Canvas.createCanvas(1200, 700);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
      gradient.addColorStop(0, "#ffe6f2");
      gradient.addColorStop(1, "#fff0f7");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 50; i++) {
        ctx.font = `${20 + Math.random() * 35}px sans-serif`;
        ctx.fillStyle = "rgba(255,105,180,0.15)";
        ctx.fillText("💖", Math.random() * canvas.width, Math.random() * canvas.height);
      }

      ctx.strokeStyle = "#ffb6d9";
      ctx.lineWidth = 16;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      ctx.font = "55px sans-serif";
      for (let i = 0; i < 6; i++) {
        ctx.fillText("🎀", 80 + i * 190, 65);
      }

      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

      const avt1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`;
      const avt2 = `https://graph.facebook.com/${partner.id}/picture?width=512&height=512&access_token=${token}`;

      async function loadImage(url) {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        return await Canvas.loadImage(response.data);
      }

      const [img1, img2] = await Promise.all([loadImage(avt1), loadImage(avt2)]);

      function drawCuteFrame(img, x, y) {
        const size = 260;

        ctx.shadowColor = "#ff69b4";
        ctx.shadowBlur = 30;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 14, y - 14, size + 28, size + 28);

        ctx.strokeStyle = "#ff8dc7";
        ctx.lineWidth = 10;
        ctx.strokeRect(x - 6, y - 6, size + 12, size + 12);

        ctx.drawImage(img, x, y, size, size);

        ctx.shadowBlur = 0;

        ctx.font = "35px sans-serif";

        ctx.fillText("🎀", x - 18, y - 18);
        ctx.fillText("🎀", x + size - 5, y - 18);

        ctx.fillText("💖", x - 10, y + size + 28);
        ctx.fillText("💖", x + size - 5, y + size + 28);
      }

      drawCuteFrame(img1, 120, 200);
      drawCuteFrame(img2, 820, 200);

      ctx.font = "130px sans-serif";
      ctx.fillText("💗", 515, 355);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ff1493";
      ctx.font = "bold 48px Sans";
      ctx.fillText(`${match}% MATCH`, 600, 520);

      ctx.fillStyle = "#d63384";
      ctx.font = "bold 32px Sans";
      ctx.fillText(senderName, 250, 585);
      ctx.fillText(partner.name, 950, 585);

      ctx.font = "28px Sans";
      ctx.fillStyle = "#ff69b4";
      ctx.fillText("Made with Love 💕", 600, 650);

      const cacheDir = path.join(__dirname, "cache");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer());

      await api.unsendMessage(loading.messageID);

      const msg = `
╭━━━〔 💞 LOVE MATCH 💞 〕━━━╮

💌 ${senderName}
💘 ${partner.name}

📊 Perfect Match: ${match}%

🌸 A cute couple has been created!

╰━━━━━━━━━━━━━━━━━━╯`;

      return api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        },
        messageID
      );

    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ | Pair system failed!", threadID, messageID);
    }
  }
};
