const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "daily",
        version: "2.0",
        author: "xalman",
        countDown: 5,
        role: 0,
        description: {
            en: "Claim your daily reward with a premium card design"
        },
        category: "game",
        guide: { en: "{pn}" }
    },

    onStart: async function ({ message, event, usersData }) {
        const { senderID } = event;
        const dateTime = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
        const cachePath = path.join(__dirname, "cache");
        if (!fs.existsSync(cachePath)) fs.ensureDirSync(cachePath);

        const userData = await usersData.get(senderID);

        if (userData.data && userData.data.lastTimeGetReward === dateTime) {
            return message.reply("❌ | You have already claimed your reward today!");
        }
        const min = 1000;
        const max = 100000;
        const randomCoin = Math.floor(Math.random() * (max - min + 1)) + min;
        const randomExp = Math.floor(Math.random() * 900) + 100;
        const formatBal = (n) => {
            if (n >= 1e6) return (n / 1e6).toFixed(2) + "m";
            if (n >= 1e3) return (n / 1e3).toFixed(2) + "k";
            return n.toLocaleString();
        };
        const createDailyCard = async (name, amount, exp, uid) => {
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 800, 400);
            grad.addColorStop(0, '#1a2a6c');
            grad.addColorStop(0.5, '#b21f1f');
            grad.addColorStop(1, '#fdbb2d');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 400);
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath();
            ctx.arc(700, 100, 150, 0, Math.PI * 2);
            ctx.fill();
            try {
                const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
                const avatarImg = await loadImage(Buffer.from(response.data));
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 120, 70, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, 50, 50, 140, 140);
                ctx.restore();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 5;
                ctx.stroke();
            } catch (e) {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(120, 120, 70, 0, Math.PI * 2);
                ctx.fill();
            }
			
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 30px Arial";
            ctx.fillText("DAILY REWARD CLAIMED!", 220, 90);
            ctx.font = "25px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillText(`User: ${name}`, 220, 130);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(50, 220);
            ctx.lineTo(750, 220);
            ctx.stroke();
            ctx.font = "bold 60px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.fillText(`+$${formatBal(amount)}`, 60, 310);
            ctx.shadowBlur = 0;
            ctx.font = "bold 25px Arial";
            ctx.fillStyle = "#ffd700";
            ctx.fillText(`Bonus: +${exp} EXP`, 60, 350);
            const cardPath = path.join(cachePath, `daily_${uid}.png`);
            fs.writeFileSync(cardPath, canvas.toBuffer());
            return cardPath;
        };

        const cardImg = await createDailyCard(userData.name || "User", randomCoin, randomExp, senderID);
        const currentMoney = Number(userData.money || 0);
        const currentExp = Number(userData.exp || 0);
        const updatedData = userData.data || {};
        updatedData.lastTimeGetReward = dateTime;

        await usersData.set(senderID, {
            money: (currentMoney + randomCoin).toString(),
            exp: currentExp + randomExp,
            data: updatedData
        });

        
        return message.reply({
            body: `🎁 daily random!\nYou received $${formatBal(randomCoin)} and ${randomExp} EXP!`,
            attachment: fs.createReadStream(cardImg)
        }, () => { if(fs.existsSync(cardImg)) fs.unlinkSync(cardImg); });
    }
};
