const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

const xalman_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";

const access = ["61570641868681", "61574478201014"];

const backgrounds = [
  "https://i.imgur.com/28OfsDZ.jpeg"
];

module.exports = {
  config: {
    name: "kidnap",
    aliases: ["kdnp"],
    version: "3.3",
    author: "xalman",
    role: 0,
    countDown: 5,
    shortDescription: "Make a kidnap-style image",
    longDescription: "Generate a kidnap-themed image using tagged user avatars.",
    category: "fun",
    guide: { en: "{pn} @mention | reply | uid" }
  },

  onStart: async function ({ api, event, message, usersData }) {

    api.setMessageReaction("🕜", event.messageID, () => {}, true);

    const senderID = event.senderID;
    let targetID = null;

    if (event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    } 
    else if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } 
    else {
      const match = event.body?.match(/\b\d{8,20}\b/);
      if (match) targetID = match[0];
    }

    if (!targetID) {
      return message.reply("❌");
    }

    if (access.includes(targetID)) {
      return message.reply("🚫");
    }

    try {
      const name1 = await usersData.getName(senderID).catch(() => "You");
      const name2 = await usersData.getName(targetID).catch(() => "Friend");

      const avatar1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${xalman_TOKEN}`;
      const avatar2 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${xalman_TOKEN}`;

      const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const [img1, img2, bgImg] = await Promise.all([
        Canvas.loadImage(avatar1),
        Canvas.loadImage(avatar2),
        Canvas.loadImage(bg)
      ]);

      const canvas = Canvas.createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);

      const p1 = { x: 510, y: 110, r: 50 };
      const p2 = { x: 270, y: 200, r: 50 };

      const draw = (img, pos) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, pos.x - pos.r, pos.y - pos.r, pos.r * 2, pos.r * 2);
        ctx.restore();
      };

      draw(img1, p1);
      draw(img2, p2);

      const file = path.join(__dirname, "tmp", `${senderID}_${targetID}.png`);

      await fs.ensureDir(path.dirname(file));
      fs.writeFileSync(file, canvas.toBuffer());

      message.reply(
        {
          body: `${name1} кι∂ηαρρє∂  ${name2} 👺`,
          attachment: fs.createReadStream(file)
        },
        () => {
          fs.unlinkSync(file);
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      );

    } catch {
      message.reply("❌");
    }
  }
};
