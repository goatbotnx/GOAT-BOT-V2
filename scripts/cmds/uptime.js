const os = require('os');
const moment = require('moment-timezone');
const axios = require('axios');
const mongoose = require('mongoose');
const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "uptime",
    version: "3.0",
    role: 0,
    author: "xalman",
    description: "Premium Uptime for Goat Bot V2 with Image Generation",
    category: "system",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, timestamp } = event;

    const sendLoading = await api.sendMessage("⏳ Generating system analytics image...", threadID);

    try {
      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = Math.floor(uptime % 60);

      const usedRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
      const cpuUsage = os.loadavg()[0].toFixed(2);
      const cpuCores = os.cpus().length;
      const cpuModel = os.cpus()[0].model;
      const cpuSpeed = os.cpus()[0].speed;
      const architecture = os.arch();
      
      const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
      const dbStatusColor = mongoose.connection.readyState === 1 ? "#00ff88" : "#ff3366";
      
      const timeNow = moment.tz("Asia/Dhaka").format("hh:mm:ss A");
      const dateNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
      const timezone = "Asia/Dhaka (GMT+6)";
      
      const latency = Date.now() - event.timestamp;
      
      const imagePath = await generateUptimeImage({
        days, hours, mins, secs,
        usedRam, totalRam, freeRam,
        cpuUsage, cpuCores, cpuModel, cpuSpeed, architecture,
        dbStatus, dbStatusColor,
        timeNow, dateNow, timezone,
        latency,
        nodeVersion: process.version,
        mongooseVersion: mongoose.version,
        platform: os.platform(),
        hostname: os.hostname(),
        osType: os.type(),
        osRelease: os.release()
      });
      
      await api.unsendMessage(sendLoading.messageID);
      
      return api.sendMessage({
        body: "𝐒𝐘𝐒𝐓𝐄𝐌 𝐀𝐍𝐀𝐋𝐘𝐓𝐈𝐂𝐒",
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        fs.unlinkSync(imagePath);
      }, messageID);
      
    } catch (error) {
      console.error("Uptime image generation error:", error);
      await api.editMessage("❌ Failed to generate system analytics card.", sendLoading.messageID);
    }
  }
};

async function generateUptimeImage(data) {
  const width = 1100;
  const height = 900;
  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f0c29');
  gradient.addColorStop(0.5, '#302b63');
  gradient.addColorStop(1, '#24243e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(width - 100 + (i * 80), 100 + (i * 60), 120, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(50 + (i * 70), height - 80 - (i * 50), 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, 80);
  
  ctx.font = 'bold 38px "Arial"';
  ctx.fillStyle = '#00ff88';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ff88';
  ctx.fillText('⚡ SYSTEM ANALYTICS', 50, 55);
  ctx.shadowBlur = 0;
  
  ctx.font = '18px "Arial"';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('GOAT BOT V2•PREMIUM EDITION', width - 280, 55);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  
  ctx.fillRect(30, 110, 480, 280);
  ctx.fillRect(540, 110, 530, 280);
  ctx.fillRect(30, 420, 1040, 200);
  ctx.fillRect(30, 650, 1040, 210);
  
  ctx.shadowBlur = 0;
  
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 110, 480, 280);
  ctx.strokeRect(540, 110, 530, 280);
  ctx.strokeRect(30, 420, 1040, 200);
  ctx.strokeRect(30, 650, 1040, 210);

  ctx.font = 'bold 22px "Arial"';
  ctx.fillStyle = '#00ff88';
  ctx.fillText('📊 UPTIME STATUS', 50, 150);
  
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('🖥️ SYSTEM RESOURCES', 560, 150);
  
  ctx.fillStyle = '#ff66cc';
  ctx.fillText('💻 CPU & PROCESSOR INFO', 50, 460);
  
  ctx.fillStyle = '#66ffcc';
  ctx.fillText('📡 DATABASE & TIMEZONE', 50, 690);

  ctx.font = '18px "Arial"';
  ctx.fillStyle = '#ffffff';
  
  ctx.fillText('⏱️ Uptime:', 60, 200);
  ctx.font = 'bold 34px "Arial"';
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`${data.days}d ${data.hours}h ${data.mins}m`, 200, 205);
  
  ctx.font = '18px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('⏱️ Seconds:', 60, 260);
  ctx.font = 'bold 26px "Arial"';
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`${data.secs}s`, 200, 265);
  
  ctx.font = '18px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('⚡ Latency:', 60, 320);
  ctx.font = 'bold 26px "Arial"';
  ctx.fillStyle = data.latency < 100 ? '#00ff88' : '#ffaa00';
  ctx.fillText(`${data.latency}ms`, 200, 325);
  
  ctx.font = '18px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🌐 Status:', 60, 370);
  ctx.font = 'bold 22px "Arial"';
  ctx.fillStyle = '#00ff88';
  ctx.fillText('● ONLINE', 200, 375);

  const ramPercent = (data.usedRam / (data.totalRam * 1024)) * 100;
  const ramBarWidth = 280;
  const ramUsedWidth = (ramPercent / 100) * ramBarWidth;
  
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(560, 200, ramBarWidth, 25);
  ctx.fillStyle = ramPercent > 80 ? '#ff3366' : '#00ff88';
  ctx.fillRect(560, 200, ramUsedWidth, 25);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`RAM USAGE: ${data.usedRam}MB / ${data.totalRam}GB`, 560, 185);
  ctx.font = '14px "Arial"';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${ramPercent.toFixed(1)}% Used`, 860, 185);
  ctx.fillText(`Free: ${data.freeRam}GB`, 560, 250);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📈 LOAD AVERAGE:', 560, 300);
  let loadColor = '#00ff88';
  if (data.cpuUsage > 2) loadColor = '#ffaa00';
  if (data.cpuUsage > 4) loadColor = '#ff3366';
  ctx.fillStyle = loadColor;
  ctx.font = 'bold 28px "Arial"';
  ctx.fillText(`${data.cpuUsage}`, 760, 305);
  ctx.font = '14px "Arial"';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('(1 minute avg)', 850, 305);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🖥️ PLATFORM:', 560, 355);
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${data.platform} (${data.osType})`, 700, 355);

  let y = 500;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🔧 CPU Model:', 60, y);
  ctx.font = '14px "Arial"';
  ctx.fillStyle = '#00ff88';
  
  let cpuName = data.cpuModel;
  if (cpuName.length > 70) {
    cpuName = cpuName.substring(0, 70) + '...';
  }
  ctx.fillText(cpuName, 200, y);
  
  y += 40;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('⚡ CPU Cores:', 60, y);
  ctx.font = 'bold 20px "Arial"';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`${data.cpuCores} Cores`, 200, y+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🚀 CPU Speed:', 400, y);
  ctx.font = 'bold 20px "Arial"';
  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`${data.cpuSpeed} MHz`, 540, y+2);
  
  y += 40;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🏗️ Architecture:', 60, y);
  ctx.font = 'bold 20px "Arial"';
  ctx.fillStyle = '#ff66cc';
  ctx.fillText(`${data.architecture}`, 200, y+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('💾 Node.js:', 400, y);
  ctx.font = 'bold 20px "Arial"';
  ctx.fillStyle = '#ff66cc';
  ctx.fillText(`${data.nodeVersion}`, 540, y+2);
  
  y += 40;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🖥️ Hostname:', 60, y);
  ctx.font = 'bold 18px "Arial"';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${data.hostname}`, 200, y+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🐧 OS Release:', 400, y);
  ctx.font = 'bold 18px "Arial"';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${data.osRelease}`, 540, y+2);

  let y2 = 730;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📦 Database:', 60, y2);
  ctx.fillStyle = data.dbStatusColor;
  ctx.font = 'bold 18px "Arial"';
  ctx.fillText(`● ${data.dbStatus}`, 200, y2+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🛢️ DB Name:', 400, y2);
  ctx.fillStyle = '#cccccc';
  ctx.fillText('TBTNX210', 540, y2+2);
  
  y2 += 45;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📦 Mongoose:', 60, y2);
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`v${data.mongooseVersion}`, 200, y2+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🌍 Timezone:', 400, y2);
  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`${data.timezone}`, 540, y2+2);
  
  y2 += 45;
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📅 Date:', 60, y2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.dateNow}`, 200, y2+2);
  
  ctx.font = 'bold 16px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🕐 Server Time:', 400, y2);
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`${data.timeNow}`, 540, y2+2);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, height - 40, width, 40);
  ctx.font = '13px "Arial"';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('© Create by xalman | All Systems Operational', 50, height - 15);
  ctx.fillText(`Generated: ${moment().format('HH:mm:ss')}`, width - 200, height - 15);
  
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 100 + (i * 35), width, 1);
  }
  ctx.globalAlpha = 1;

  const tempFilePath = path.join(__dirname, 'cache', `uptime_${Date.now()}.png`);
  const cacheDir = path.join(__dirname, 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const buffer = canvas.toBuffer();
  fs.writeFileSync(tempFilePath, buffer);
  
  return tempFilePath;
}
