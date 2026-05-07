const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    version: "3.0",
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

      const canvas = Canvas.createCanvas(1600, 900);
      const ctx = canvas.getContext("2d");

      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, "#1a0033");
      bgGradient.addColorStop(0.3, "#2d004d");
      bgGradient.addColorStop(0.6, "#4a0066");
      bgGradient.addColorStop(1, "#2d004d");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255, 200, 255, ${Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255, 100, 200, ${Math.random() * 0.3})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }

      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff66cc";
      ctx.strokeStyle = "#ff66cc";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      ctx.strokeStyle = "#ff99ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
      ctx.shadowBlur = 0;

      ctx.font = "60px sans-serif";
      ctx.fillStyle = "#ff66cc";
      ctx.fillText("💖", 40, 80);
      ctx.fillText("💖", canvas.width - 100, 80);
      ctx.fillText("💖", 40, canvas.height - 40);
      ctx.fillText("💖", canvas.width - 100, canvas.height - 40);

      ctx.font = "45px sans-serif";
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(255, 102, 204, ${0.3 + Math.sin(i) * 0.2})`;
        ctx.fillText("✨", 80 + i * 130, 70);
      }

      ctx.font = "bold 64px 'Arial'";
      ctx.fillStyle = "#ff99ff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff66cc";
      ctx.textAlign = "center";
      ctx.fillText("💕 PERFECT MATCH 💕", canvas.width / 2, 120);
      ctx.font = "30px 'Arial'";
      ctx.fillStyle = "#ffccff";
      ctx.fillText("✧ A Match Made in Heaven ✧", canvas.width / 2, 170);
      ctx.shadowBlur = 0;

      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

      const avt1 = `https://graph.facebook.com/${senderID}/picture?width=1024&height=1024&access_token=${token}`;
      const avt2 = `https://graph.facebook.com/${partner.id}/picture?width=1024&height=1024&access_token=${token}`;

      async function loadImage(url) {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        return await Canvas.loadImage(response.data);
      }

      const [img1, img2] = await Promise.all([loadImage(avt1), loadImage(avt2)]);

      function drawPremiumFrame(img, x, y) {
        const size = 320;
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#ff66cc";
        
        ctx.fillStyle = "#ff66cc";
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2 + 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2 + 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2 - 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff99ff";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.font = "50px sans-serif";
        ctx.fillStyle = "#ffcc00";
        ctx.fillText("👑", x + size/2 - 30, y - 15);
        
        ctx.font = "35px sans-serif";
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const heartX = x + size/2 + Math.cos(angle) * (size/2 + 25);
          const heartY = y + size/2 + Math.sin(angle) * (size/2 + 25);
          ctx.fillStyle = "#ff66cc";
          ctx.fillText("💗", heartX - 15, heartY + 10);
        }
      }

      drawPremiumFrame(img1, 240, 260);
      drawPremiumFrame(img2, 1040, 260);

      ctx.shadowBlur = 25;
      ctx.shadowColor = "#ff3399";
      ctx.font = "160px sans-serif";
      ctx.fillStyle = "#ff3399";
      ctx.fillText("💕", canvas.width / 2 - 70, 480);
      ctx.fillStyle = "#ff66cc";
      ctx.font = "140px sans-serif";
      ctx.fillText("💗", canvas.width / 2 - 65, 475);
      ctx.shadowBlur = 0;

      const centerX = canvas.width / 2;
      const centerY = 630;
      const radius = 80;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 102, 204, 0.3)";
      ctx.lineWidth = 12;
      ctx.stroke();
      
      ctx.beginPath();
      const angle = (match / 100) * Math.PI * 2;
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.strokeStyle = "#ff66cc";
      ctx.lineWidth = 12;
      ctx.stroke();
      
      ctx.font = "bold 52px 'Arial'";
      ctx.fillStyle = "#ff99ff";
      ctx.fillText(`${match}%`, centerX - 55, centerY + 20);
      ctx.font = "24px 'Arial'";
      ctx.fillStyle = "#ffccff";
      ctx.fillText("MATCH", centerX - 45, centerY + 60);
      
      ctx.font = "bold 38px 'Arial'";
      ctx.fillStyle = "#ffccff";
      ctx.fillText("✦ PERFECT PAIR ✦", canvas.width / 2, 750);

      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff66cc";
      ctx.font = "bold 42px 'Arial'";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(senderName, 450, 830);
      ctx.fillText(partner.name, 1150, 830);
      ctx.shadowBlur = 0;

      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ff99ff";
      ctx.fillText("💖", 350, 845);
      ctx.fillText("💖", 550, 845);
      ctx.fillText("💖", 1050, 845);
      ctx.fillText("💖", 1250, 845);

      const footerGradient = ctx.createLinearGradient(0, canvas.height - 80, canvas.width, canvas.height - 80);
      footerGradient.addColorStop(0, "#ff66cc");
      footerGradient.addColorStop(1, "#ff3399");
      ctx.fillStyle = footerGradient;
      ctx.fillRect(0, canvas.height - 80, canvas.width, 4);
      
      ctx.font = "26px 'Arial'";
      ctx.fillStyle = "#ffccff";
      ctx.fillText("✨ A beautiful love story begins here ✨", canvas.width / 2, canvas.height - 35);
      
      ctx.font = "20px 'Arial'";
      ctx.fillStyle = "rgba(255, 204, 255, 0.6)";
      ctx.fillText("Xalman Pair System", canvas.width / 2, canvas.height - 12);

      for (let i = 0; i < 15; i++) {
        ctx.font = `${20 + Math.random() * 30}px sans-serif`;
        ctx.fillStyle = `rgba(255, 102, 204, ${0.1 + Math.random() * 0.2})`;
        ctx.fillText("💗", Math.random() * canvas.width, Math.random() * canvas.height);
      }

      const cacheDir = path.join(__dirname, "cache");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer());

      await api.unsendMessage(loading.messageID);

      const msg = `
╭━━━━━━━━━━━━━━━━━━╮
│    💕 LOVE MATCH 💕    │
╰━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━┓
┃ 💌 ${senderName}
┃ 💘 ${partner.name}
┃ 📊 Match: ${match}%
┃ 💞 Compatibility: ${match > 85 ? "Perfect" : match > 75 ? "Great" : "Good"}
┃ ✨ Status: Matched!
┗━━━━━━━━━━━━━━━━━━┛

🌸 A beautiful couple has been created!
💫 May your virtual love story begin!`;

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
      return api.sendMessage("❌ | Pair system failed! Please try again.", threadID, messageID);
    }
  }
};
