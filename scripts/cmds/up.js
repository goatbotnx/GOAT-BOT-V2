const axios = require('axios');
const os = require('os');
const { createCanvas } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "up",
    version: "10.0",
    author: "xalman",
    countDown: 10,
    role: 0,
    description: "see  UPtime information in Galaxy picture",
    category: "system"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const { threadID, messageID, timestamp } = event;

    try {
      const [allUsers, allThreads] = await Promise.all([
        usersData.getAll(),
        threadsData.getAll()
      ]);

      const memory = process.memoryUsage();
      const uptime = process.uptime();
      const serverUptime = os.uptime();
      const totalRam = (os.totalmem() / (1024 ** 3)).toFixed(2);
      const usedRam = (memory.rss / 1024 / 1024).toFixed(2);
      const ramPercent = ((memory.rss / os.totalmem()) * 100).toFixed(1);
      const cpuLoad = (os.loadavg()[0]).toFixed(2);
      const cpuModel = os.cpus()[0].model.split(' ')[0];

      const width = 1200, height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d', { alpha: false });

      const grad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
      grad.addColorStop(0, '#1a0033');
      grad.addColorStop(0.6, '#050510');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 80; i++) {
        ctx.globalAlpha = Math.random();
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
      }
      ctx.globalAlpha = 1.0;

      ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
      ctx.font = 'bold 50px Arial'; ctx.fillStyle = '#00f2ff'; ctx.textAlign = 'center';
      ctx.fillText('SYSTEM ANALYTICS', width / 2, 70);
      ctx.shadowBlur = 0;

      const stats = [
        { l: "🕒 UPTIME", v: formatTime(uptime) },
        { l: "🖥️ SERVER", v: formatTime(serverUptime) },
        { l: "🚀 PING", v: `${Date.now() - timestamp}ms` },
        { l: "📊 LOAD", v: `${cpuLoad}%` },
        { l: "👥 USERS", v: allUsers.length.toLocaleString() },
        { l: "🏘️ GROUPS", v: allThreads.length.toLocaleString() },
        { l: "⚙️ CPU", v: cpuModel },
        { l: "📟 USED", v: `${usedRam} MB` },
        { l: "💾 TOTAL", v: `${totalRam} GB` },
        { l: "📦 NODE", v: process.version }
      ];

      ctx.textAlign = 'left';
      stats.forEach((item, i) => {
        const x = i < 5 ? 50 : 630;
        const y = 110 + (i % 5) * 80;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
        drawPanel(ctx, x, y, 520, 65, 10);
        ctx.fill(); ctx.stroke();

        ctx.font = '16px Arial'; ctx.fillStyle = '#00f2ff';
        ctx.fillText(item.l, x + 20, y + 25);
        ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#ffffff';
        ctx.fillText(item.v, x + 20, y + 52);
      });

      const barX = 50, barY = 520, barW = 1100, barH = 25;
      const fillW = (barW * (ramPercent > 100 ? 100 : ramPercent)) / 100;
      drawPanel(ctx, barX, barY, barW, barH, 5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fill();
      
      const g = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      g.addColorStop(0, '#00f2ff'); g.addColorStop(1, '#ff0055');
      ctx.fillStyle = g;
      drawPanel(ctx, barX, barY, fillW, barH, 5);
      ctx.fill();

      ctx.font = 'italic 20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by Xalman', width / 2, 580);

      const cachePath = path.join(__dirname, 'cache', `up_fast.png`);
      fs.ensureDirSync(path.join(__dirname, 'cache'));
      fs.writeFileSync(cachePath, canvas.toBuffer('image/png', { compressionLevel: 0 }));

      return api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
      api.sendMessage(`Error: ${e.message}`, threadID);
    }
  }
};

function drawPanel(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function formatTime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return `${d}d ${h}h ${m}m ${sec}s`;
    }
