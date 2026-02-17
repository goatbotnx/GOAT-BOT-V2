const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "9.0.0",
    author: "xalman",
    role: 0,
    countDown: 5,
    description: "Search to get pinterest Premium Grid , reply number to get full imgae ",
    category: "image"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query)
      return api.sendMessage(" Write something  example /pin cat....", event.threadID);

    api.setMessageReaction("🕑", event.messageID, () => {}, true);

    try {
      const githubRaw = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
      const apiList = await axios.get(githubRaw);
      const baseUrl = apiList.data.pin;

      const res = await axios.get(`${baseUrl}/search-img?query=${encodeURIComponent(query)}&type=json`);
      const { data } = res.data;

      if (!data || data.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("", event.threadID);
      }

      const images = data.slice(0, 30);
      await sendGrid({ api, event, images, page: 0, query });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.log(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("API সমস্যা!", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { images, page, query } = Reply;
    const input = event.body.toLowerCase();

    if (input === "next") {

      api.setMessageReaction("🕑", event.messageID, () => {}, true);

      const nextPage = page + 1;
      if (nextPage * 10 >= images.length)
        return api.sendMessage("no more page....!", event.threadID);

      await sendGrid({ api, event, images, page: nextPage, query });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      return;
    }

    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= 10) {

      api.setMessageReaction("🕑", event.messageID, () => {}, true);

      const index = page * 10 + (num - 1);
      if (!images[index])
        return api.sendMessage("Image not found.", event.threadID);

      const stream = (await axios.get(images[index], { responseType: "stream" })).data;

      await api.sendMessage({
        body: ` (${num})`,
        attachment: stream
      }, event.threadID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    }
  }
};

async function sendGrid({ api, event, images, page, query }) {

  const start = page * 10;
  const slice = images.slice(start, start + 10);

  const columns = 3;
  const gap = 25;
  const columnWidth = 350;

  let columnHeights = Array(columns).fill(160);
  const loadedImages = [];

  for (let url of slice) {
    try {
      const img = await loadImage(url);
      const ratio = img.height / img.width;
      const newHeight = columnWidth * ratio;

      loadedImages.push({ img, height: newHeight });
    } catch (e) {}
  }

  for (let item of loadedImages) {
    const shortest = columnHeights.indexOf(Math.min(...columnHeights));
    columnHeights[shortest] += item.height + gap;
  }

  const canvasHeight = Math.max(...columnHeights) + 120;
  const canvasWidth = columns * columnWidth + (columns + 1) * gap;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = "#111";
  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillText(query.toUpperCase(), canvasWidth / 2, 60);

  ctx.fillStyle = "#666";
  ctx.font = "22px Arial";
  ctx.fillText(`Page ${page + 1}`, canvasWidth / 2, 100);

  columnHeights = Array(columns).fill(160);

  for (let i = 0; i < loadedImages.length; i++) {

    const shortest = columnHeights.indexOf(Math.min(...columnHeights));
    const x = gap + shortest * (columnWidth + gap);
    const y = columnHeights[shortest];

    const { img, height } = loadedImages[i];

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, columnWidth, height, 18);
    ctx.clip();
    ctx.drawImage(img, x, y, columnWidth, height);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x + 28, y + 28, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#e60023";
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(i + 1, x + 28, y + 28);

    columnHeights[shortest] += height + gap;
  }

  ctx.fillStyle = "#999";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("powered by xalman", canvasWidth / 2, canvasHeight - 40);

  const filePath = path.join(__dirname, "cache", `grid_${Date.now()}.png`);
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

  const msg = await api.sendMessage({
    body: `📌 ${query}\nReply:\n• next ➜ Next Page\n• reply number➜ Full Image`,
    attachment: fs.createReadStream(filePath)
  }, event.threadID);

  global.GoatBot.onReply.set(msg.messageID, {
    commandName: "pin",
    images,
    page,
    query
  });
}
