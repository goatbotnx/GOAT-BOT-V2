const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");

module.exports = {
  config: {
    name: "ytb",
    aliases: ["youtube", "ytmp4", "song"],
    version: "5.0",
    author: "xalman",
    countDown: 3,
    role: 0,
    description: "Download YouTube videos or search for songs",
    category: "media",
    guide: "{pn} [song name] - Search for songs\n{pn} [YouTube link] - Download video"
  },

  onStart: async function ({ api, event, args, message }) {
    const { messageID, type, messageReply, threadID } = event;
    
    if (args.length === 0) {
      return message.reply("🎵 **YouTube Downloader & Search**\n━━━━━━━━━━━━━━━━━━━━\n\n📌 **Usage:**\n• `{pn} Believer` - Search for songs\n• `{pn} https://youtube.com/xxx` - Download video\n\n💡 **Tip:** Reply to search results with number to download!");
    }

    const input = args.join(" ");
    
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+)/g;
    const isLink = youtubeRegex.test(input);
    
    if (isLink) {
      const urlMatch = input.match(youtubeRegex);
      const url = urlMatch[0];
      api.setMessageReaction("📥", messageID, () => {}, true);
      return this.downloadAndSend(api, messageID, message, url);
    } else {
      const searchQuery = args.join(" ");
      api.setMessageReaction("🔍", messageID, () => {}, true);
      return this.searchSong(api, event, message, searchQuery);
    }
  },

  onChat: async function ({ api, event, message }) {
    const { body, messageID, messageReply, threadID } = event;
    
    if (messageReply && global.ytdlSessions && global.ytdlSessions[messageReply.messageID]) {
      const session = global.ytdlSessions[messageReply.messageID];
      const number = parseInt(body.trim());
      
      if (!isNaN(number) && number >= 1 && number <= session.songs.length) {
        const selectedSong = session.songs[number - 1];
        api.setMessageReaction("🎵", messageID, () => {}, true);
        const loadingMsg = await message.reply(`🎵 **Downloading:** ${selectedSong.title}\n⏱️ Please wait...`);
        await this.downloadAndSend(api, messageID, message, selectedSong.url);
        setTimeout(() => {
          api.unsendMessage(loadingMsg.messageID);
        }, 2000);
        return;
      }
      
      const match = body.match(/download\s+(\d+)/i);
      if (match) {
        const number = parseInt(match[1]);
        if (number >= 1 && number <= session.songs.length) {
          const selectedSong = session.songs[number - 1];
          api.setMessageReaction("🎵", messageID, () => {}, true);
          const loadingMsg = await message.reply(`🎵 **Downloading:** ${selectedSong.title}\n⏱️ Please wait...`);
          await this.downloadAndSend(api, messageID, message, selectedSong.url);
          setTimeout(() => {
            api.unsendMessage(loadingMsg.messageID);
          }, 2000);
          return;
        }
      }
    }
    
    if (!body) return;
    
    const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+)/g;
    const match = body.match(regex);
    
    if (match && !body.startsWith(global.config.PREFIX)) {
      const url = match[0];
      api.setMessageReaction("📥", messageID, () => {}, true);
      return this.downloadAndSend(api, messageID, message, url);
    }
  },

  searchSong: async function (api, event, message, query) {
    const { messageID, threadID } = event;
    const xalman_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const searchUrl = `https://xalman-apis.vercel.app/api/ytsearch?q=${encodeURIComponent(query)}`;

    try {
      const sendLoading = await message.reply(`🔍 **Searching for:** "${query}"\n⏱️ Please wait...`);

      const response = await axios.get(searchUrl, {
        headers: { "User-Agent": xalman_UA }
      });

      if (!response.data.status || response.data.results.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        await api.unsendMessage(sendLoading.messageID);
        return message.reply(`❌ No results found for: "${query}"\n\n💡 Try different keywords.`);
      }

      const results = response.data.results.slice(0, 5);
      
      const thumbnails = [];
      for (let i = 0; i < results.length; i++) {
        const song = results[i];
        try {
          const thumbResponse = await axios.get(song.thumbnail, {
            responseType: 'arraybuffer'
          });
          const thumbBuffer = Buffer.from(thumbResponse.data, 'binary');
          const thumbImage = await Canvas.loadImage(thumbBuffer);
          thumbnails.push(thumbImage);
        } catch (err) {
          thumbnails.push(null);
        }
      }
      
      const imagePath = await generateSearchImage(results, query, thumbnails);
      
      await api.unsendMessage(sendLoading.messageID);
      api.setMessageReaction("✅", messageID, () => {}, true);
      
      return api.sendMessage({
        body: "🎵Reply with number (1-5) to download!",
        attachment: fs.createReadStream(imagePath)
      }, threadID, (err, info) => {
        fs.unlinkSync(imagePath);
        
        if (!global.ytdlSessions) global.ytdlSessions = {};
        global.ytdlSessions[info.messageID] = {
          songs: results.map(song => ({
            title: song.title,
            url: song.url,
            duration: song.duration,
            views: song.views,
            ago: song.ago,
            channel: song.channel
          })),
          timestamp: Date.now(),
          threadID: threadID,
          query: query
        };
        
        api.setMessageReaction("💾", info.messageID, () => {}, true);
        
        setTimeout(() => {
          if (global.ytdlSessions && global.ytdlSessions[info.messageID]) {
            delete global.ytdlSessions[info.messageID];
          }
        }, 300000);
      });
      
    } catch (error) {
      console.error("Search error:", error);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return message.reply("❌ An error occurred while searching. Please try again.");
    }
  },

  downloadAndSend: async function (api, messageID, message, url) {
    const CACHE_DIR = path.join(__dirname, "cache");
    const xalman_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    const apiUrl = `https://xalman-apis.vercel.app/api/ytdlv2?url=${encodeURIComponent(url)}`;

    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
      const filePath = path.join(CACHE_DIR, `${Date.now()}_ytdl.mp4`);

      const response = await axios({
        method: 'get',
        url: apiUrl,
        headers: { "User-Agent": xalman_UA },
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        message.reply({
          body: "📥 Here is your video:",
          attachment: fs.createReadStream(filePath)
        }, (err) => {
          fs.unlinkSync(filePath);
          if (err) console.error("Send error:", err);
        });
      });

      writer.on('error', (err) => {
        console.error("Write error:", err);
        throw err;
      });

    } catch (e) {
      console.error(e);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return message.reply("❌ An error occurred while downloading the video.");
    }
  }
};

async function generateSearchImage(results, query, thumbnails) {
  const width = 1080;
  const height = 1920;
  const canvas = Canvas.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a2a');
  gradient.addColorStop(0.3, '#0d1b3e');
  gradient.addColorStop(0.6, '#1a2a4a');
  gradient.addColorStop(1, '#0a0a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#1a3a6a';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < width; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 60) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(width - 100, 200 + (i * 150), 120, 0, Math.PI * 2);
    ctx.fillStyle = '#0088ff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(100, 300 + (i * 180), 80, 0, Math.PI * 2);
    ctx.fillStyle = '#0066cc';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, width, 160);
  
  ctx.strokeStyle = '#0088ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();
  
  ctx.font = 'bold 52px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('▶', 60, 85);
  ctx.fillStyle = '#0088ff';
  ctx.fillText('YouTube', 110, 85);
  
  ctx.font = 'bold 32px "Arial"';
  ctx.fillStyle = '#ffffff';
  let displayQuery = query;
  if (displayQuery.length > 25) displayQuery = displayQuery.substring(0, 22) + '...';
  ctx.fillText(`"${displayQuery}"`, 60, 140);
  
  ctx.font = '24px "Arial"';
  ctx.fillStyle = '#0088ff';
  ctx.fillText(`${results.length} results found`, width - 250, 140);
  
  ctx.strokeStyle = '#0088ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 165);
  ctx.lineTo(width - 60, 165);
  ctx.stroke();

  let y = 220;
  const cardHeight = 280;
  
  for (let i = 0; i < results.length; i++) {
    const song = results[i];
    const thumbImage = thumbnails[i];
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(40, y, width - 80, cardHeight);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = '#0088ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, y, width - 80, cardHeight);
    
    ctx.fillStyle = '#0088ff';
    ctx.beginPath();
    ctx.arc(100, y + 70, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = 'bold 42px "Arial"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${i + 1}`, 85, y + 90);
    
    if (thumbImage) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(160, y + 20, 180, 120);
      ctx.drawImage(thumbImage, 160, y + 20, 180, 120);
      
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#0088ff';
      ctx.beginPath();
      ctx.moveTo(260, y + 55);
      ctx.lineTo(260, y + 105);
      ctx.lineTo(295, y + 80);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(160, y + 20, 180, 120);
      ctx.font = '64px "Arial"';
      ctx.fillStyle = '#0088ff';
      ctx.fillText('🎵', 230, y + 100);
    }
    
    ctx.font = 'bold 28px "Arial"';
    ctx.fillStyle = '#ffffff';
    let title = song.title;
    if (title.length > 45) title = title.substring(0, 42) + '...';
    ctx.fillText(title, 370, y + 55);
    
    ctx.font = '20px "Arial"';
    ctx.fillStyle = '#0088ff';
    let channel = song.channel;
    if (channel.length > 35) channel = channel.substring(0, 32) + '...';
    ctx.fillText(`📺 ${channel}`, 370, y + 95);
    
    ctx.font = '18px "Arial"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`⏱️ ${song.duration}`, 370, y + 135);
    
    ctx.font = '18px "Arial"';
    ctx.fillStyle = '#66ccff';
    let views = song.views;
    if (views >= 1000000) {
      views = (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      views = (views / 1000).toFixed(1) + 'K';
    }
    ctx.fillText(`👁️ ${views} views`, 530, y + 135);
    
    ctx.font = '18px "Arial"';
    ctx.fillStyle = '#aaccff';
    ctx.fillText(`📅 ${song.ago}`, 690, y + 135);
    
    ctx.font = 'bold 20px "Arial"';
    ctx.fillStyle = '#0088ff';
    ctx.fillText(`💡 Reply "${i + 1}" to download`, 370, y + 190);
    
    const lineGradient = ctx.createLinearGradient(60, y + cardHeight - 10, width - 60, y + cardHeight - 10);
    lineGradient.addColorStop(0, '#0088ff');
    lineGradient.addColorStop(0.5, '#00aaff');
    lineGradient.addColorStop(1, '#0088ff');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, y + cardHeight - 10);
    ctx.lineTo(width - 60, y + cardHeight - 10);
    ctx.stroke();
    
    y += cardHeight + 15;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, height - 100, width, 100);
  
  ctx.font = 'bold 24px "Arial"';
  ctx.fillStyle = '#0088ff';
  ctx.fillText('💡 Quick Download:', 60, height - 45);
  ctx.font = '22px "Arial"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Reply with number (1-5) to download instantly!', 330, height - 45);
  
  ctx.font = '16px "Arial"';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('Powered by xalman', width - 220, height - 30);
  
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(0, 180 + (i * 45), width, 1);
  }
  ctx.globalAlpha = 1;

  const tempDir = path.join(__dirname, 'cache');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const imagePath = path.join(tempDir, `ytsearch_${Date.now()}.png`);
  const buffer = canvas.toBuffer();
  fs.writeFileSync(imagePath, buffer);
  
  return imagePath;
}
