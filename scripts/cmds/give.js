const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const ACCESS_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";

module.exports = {
    config: {
        name: "give",
        aliases: ["send", "transfer"],
        version: "6.0",
        author: "xalman",
        countDown: 2,
        role: 0,
        description: "Cyberpunk transfer with avatar",
        category: "economy",
        guide: "{pn} @tag [amount]"
    },

    onStart: async function ({ message, event, usersData, args }) {

        const senderID = event.senderID;

        const targetUID =
            event.messageReply?.senderID ||
            Object.keys(event.mentions || {})[0];

        const parseAmount = (str) => {
            if (!str) return NaN;
            str = str.toLowerCase();

            let num = parseFloat(str);
            if (isNaN(num)) return NaN;

            const map = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
            const unit = str.slice(-1);

            if (map[unit]) num *= map[unit];

            return Math.floor(num);
        };

        const formatMoney = (num) => {
            const units = [
                { v: 1e12, s: "T" },
                { v: 1e9, s: "B" },
                { v: 1e6, s: "M" },
                { v: 1e3, s: "K" }
            ];

            for (const u of units) {
                if (num >= u.v)
                    return (num / u.v).toFixed(2).replace(/\.00$/, "") + u.s;
            }

            return num.toString();
        };

        const amount = parseAmount(args.at(-1));

        if (!targetUID || targetUID === senderID || !amount || amount <= 0) {
            return message.reply("❌ Usage: give @tag [amount]");
        }

        const senderData = await usersData.get(senderID);
        const receiverData = await usersData.get(targetUID);

        if (!receiverData) return message.reply("❌ User not found!");

        const senderMoney = Number(senderData.money || 0);

        if (senderMoney < amount) {
            return message.reply("❌ Not enough balance!");
        }

        await Promise.all([
            usersData.set(senderID, {
                money: (senderMoney - amount).toString()
            }),
            usersData.set(targetUID, {
                money: (Number(receiverData.money || 0) + amount).toString()
            })
        ]);

        const getAvatar = async (uid) => {
            try {
                const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
                const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
                return await loadImage(res.data);
            } catch {
                try {
                    const fallback = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
                    const res = await axios.get(fallback, { responseType: "arraybuffer" });
                    return await loadImage(res.data);
                } catch {
                    return null;
                }
            }
        };

        const senderAvatar = await getAvatar(senderID);
        const receiverAvatar = await getAvatar(targetUID);

        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext("2d");

        const bg = ctx.createLinearGradient(0, 0, 800, 450);
        bg.addColorStop(0, "#0f2027");
        bg.addColorStop(1, "#000");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 800, 450);

        ctx.strokeStyle = "rgba(0,255,255,0.06)";
        for (let i = 0; i < 800; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 450);
            ctx.stroke();
        }
        for (let i = 0; i < 450; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(800, i);
            ctx.stroke();
        }

        ctx.strokeStyle = "#00f7ff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00f7ff";
        ctx.shadowBlur = 20;
        ctx.strokeRect(10, 10, 780, 430);
        ctx.shadowBlur = 0;

        const drawAvatar = (img, x) => {
            if (!img) return;

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, 120, 50, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x - 50, 70, 100, 100);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(x, 120, 60, 0, Math.PI * 2);
            ctx.strokeStyle = "#00f7ff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#00f7ff";
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.shadowBlur = 0;
        };

        drawAvatar(senderAvatar, 120);
        drawAvatar(receiverAvatar, 260);

        ctx.fillStyle = "#00f7ff";
        ctx.font = "bold 30px monospace";
        ctx.fillText("BALANCE TRANSFER ", 350, 70);

        ctx.font = "30px monospace";
        ctx.fillStyle = "#ff00ff";
        ctx.fillText(`FROM: ${senderData.name}`, 350, 150);

        ctx.fillStyle = "#00ff9f";
        ctx.fillText(`TO: ${receiverData.name}`, 350, 200);

        ctx.fillStyle = "#00f7ff";
        ctx.font = "bold 65px Arial";
        ctx.shadowColor = "#00f7ff";
        ctx.shadowBlur = 25;
        ctx.fillText(`$${formatMoney(amount)}`, 350, 300);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#aaa";
        ctx.font = "20px monospace";
        ctx.fillText(new Date().toLocaleString(), 350, 360);

        const txID = Math.random().toString(36).slice(2, 10).toUpperCase();
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(`TX-ID: ${txID}`, 550, 400);

        const filePath = path.join(__dirname, "cache", `give_${senderID}.png`);
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, canvas.toBuffer());

        return message.reply({
            body: `✅ Sent $${formatMoney(amount)} to ${receiverData.name}`,
            attachment: fs.createReadStream(filePath)
        }, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }
};
