const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
    config: {
        name: "ping",
        aliases: ["pong"],
        version: "4.1",
        author: "xalman",
        category: "system",
        countDown: 5,
        role: 0,
        shortDescription: "premium Ping checker",
    },

    onStart: async function ({ message }) {
        const start = Date.now();
        await axios.get('https://www.google.com');
        const end = Date.now();
        const latency = end - start;

        const width = 800;
        const height = 550;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#000428');
        bg.addColorStop(1, '#004e92');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for (let i = 0; i < height; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(50, 50, 700, 450, 30);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        const centerX = 400;
        const centerY = 320;

        ctx.shadowBlur = 30;
        ctx.shadowColor = latency < 200 ? '#00fff2' : '#ffea00';
        ctx.strokeStyle = latency < 200 ? '#00fff2' : '#ffea00';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 180, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 0.8) + (i / 20) * (Math.PI * 1.4);
            const isActive = (i / 20) <= (Math.min(latency, 1000) / 1000);
            ctx.fillStyle = isActive ? (latency < 200 ? '#00fff2' : '#ffea00') : 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(centerX + 150 * Math.cos(angle), centerY + 150 * Math.sin(angle), 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 85px "Segoe UI", Arial';
        ctx.fillText(latency, centerX, centerY + 20);

        ctx.font = '30px Arial';
        ctx.fillText('MS', centerX + 110, centerY + 20);

        ctx.shadowBlur = 0;
        ctx.font = 'bold 22px Courier New';
        ctx.fillStyle = '#00fff2';
        ctx.fillText('SYSTEM LATENCY CHECK', centerX, centerY - 80);

        let status = latency < 150 ? "ULTRA FAST" : latency < 300 ? "STABLE" : "DELAYED";
        let statusColor = latency < 150 ? "#00ff88" : latency < 300 ? "#ffea00" : "#ff4444";

        ctx.fillStyle = statusColor;
        ctx.roundRect(centerX - 100, centerY + 80, 200, 45, 10);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(status, centerX, centerY + 110);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.fillText(`POWARED BY XALMAN | VERSION 4.1`, centerX, height - 20);

        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const filePath = path.join(cacheDir, `ping_pro_${Date.now()}.png`);
        fs.writeFileSync(filePath, canvas.toBuffer());

        await message.reply({
            attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);
    }
};
