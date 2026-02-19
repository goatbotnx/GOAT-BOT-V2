const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const nx_210 = "xalman";

module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "4.5.0",
        author: "xalman",
        countDown: 5,
        role: 0,
        description: "View your premium neon balance card ",
        category: "economy",
        guide: { en: "{pn} | {pn} @tag" }
    },

    onStart: async function ({ message, usersData, event, args }) {
        const senderID = event.senderID;

        const formatBalance = (num) => {
            const n = Number(num);
            if (n === Infinity || isNaN(n)) return "∞ Unlimited";
            if (n < 1000) return n.toFixed(0);

            const units = [
                { v: 1e30, s: "No" }, { v: 1e27, s: "Oc" }, { v: 1e24, s: "Sp" },
                { v: 1e21, s: "Sx" }, { v: 1e18, s: "Qi" }, { v: 1e15, s: "Q" },
                { v: 1e12, s: "T" }, { v: 1e9, s: "B" }, { v: 1e6, s: "M" }, { v: 1e3, s: "K" }
            ];

            for (let i = 0; i < units.length; i++) {
                if (n >= units[i].v) {
                    return (n / units[i].v).toFixed(2).replace(/\.00$/, '') + units[i].s;
                }
            }
            return n.toLocaleString();
        };

        const getTargetUID = () => {
            if (event.messageReply) return event.messageReply.senderID;
            if (Object.keys(event.mentions).length > 0) return Object.keys(event.mentions)[0];
            if (args[0] && !isNaN(args[0])) return args[0];
            return null;
        };

        const createUniqueCard = async (name, balance, uid) => {
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, '#0f0c29');
            gradient.addColorStop(0.5, '#302b63');
            gradient.addColorStop(1, '#24243e');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(0, 0, 800, 450, 30);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 100 + i * 30);
                ctx.bezierCurveTo(200, 50 + i * 20, 500, 400 + i * 20, 800, 300);
                ctx.stroke();
            }

            ctx.font = "bold 32px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("GOAT BANK LTD.", 50, 60);

            try {
                const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
                const avatarImg = await loadImage(Buffer.from(response.data));
                ctx.save();
                ctx.shadowColor = '#00d2ff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(100, 150, 60, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatarImg, 40, 90, 120, 120);
                ctx.restore();
                ctx.strokeStyle = "#00d2ff";
                ctx.lineWidth = 3;
                ctx.stroke();
            } catch (e) {}

            ctx.fillStyle = "#ffffff";
            ctx.font = "italic bold 40px sans-serif";
            ctx.fillText("VISA", 650, 60);

            ctx.font = "20px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillText("AVAILABLE BALANCE", 60, 260);

            const displayBal = formatBalance(balance);
            ctx.shadowColor = "#00d2ff";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#00d2ff";
            
            // Dynamic Font Sizing for Large Balances
            if (displayBal.length > 12) ctx.font = "bold 45px Arial";
            else if (displayBal.length > 8) ctx.font = "bold 60px Arial";
            else ctx.font = "bold 80px Arial";
            
            ctx.fillText(`$${displayBal}`, 60, 330);

            ctx.shadowBlur = 0;
            ctx.font = "28px monospace";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            const formattedUID = uid.toString().padEnd(16, '0').match(/.{1,4}/g).join("  ");
            ctx.fillText(formattedUID, 60, 385);

            ctx.font = "bold 25px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(name.toUpperCase(), 60, 420);
            
            ctx.font = "18px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fillText("VALID THRU: 12/29", 580, 420);

            const cachePath = path.join(__dirname, "cache");
            if (!fs.existsSync(cachePath)) fs.ensureDirSync(cachePath);
            const cardPath = path.join(cachePath, `premium_card_${uid}.png`);
            fs.writeFileSync(cardPath, canvas.toBuffer());
            return cardPath;
        };

        const targetID = getTargetUID() || senderID;
        const userData = await usersData.get(targetID);
        if (!userData) return message.reply("User not found!");

        if (!args[0] || !["transfer"].includes(args[0])) {
            const cardImg = await createUniqueCard(userData.name || "Global User", userData.money || 0, targetID);
            return message.reply({
                body: `💳 GOAT BANK Premium Card: ${userData.name}\n💰 Balance: $${formatBalance(userData.money || 0)}`,
                attachment: fs.createReadStream(cardImg)
            }, () => { if(fs.existsSync(cardImg)) fs.unlinkSync(cardImg); });
        }

        if (args[0] === "transfer") {
            const targetUID = getTargetUID();
            const amountStr = args[args.length - 1];
            let amount = parseInt(amountStr);
            if (amountStr.toLowerCase().endsWith('k')) amount *= 1000;
            if (amountStr.toLowerCase().endsWith('m')) amount *= 1000000;
            if (amountStr.toLowerCase().endsWith('b')) amount *= 1000000000;

            if (!targetUID || isNaN(amount) || amount <= 0) return message.reply("❌ Usage: balance transfer @tag [amount]");
            const senderData = await usersData.get(senderID);
            if (Number(senderData.money) < amount) return message.reply("❌ Insufficient balance!");
            
            const receiverData = await usersData.get(targetUID);
            await usersData.set(senderID, { money: (Number(senderData.money) - amount).toString() });
            await usersData.set(targetUID, { money: (Number(receiverData.money || 0) + amount).toString() });
            
            return message.reply(`✅ Transferred $${formatBalance(amount)} to ${receiverData.name}\nSystem Provider: ${nx_210}`);
        }
    }
};
                
