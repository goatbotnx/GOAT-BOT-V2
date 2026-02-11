const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

const ACCESS_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";
const access = "61583129938292";
const COST = 1000;

const backgrounds = [
  "https://i.ibb.co/fdCKDdh1/dd9c70eb5811.jpg"
];

module.exports = {
  config: {
    name: "squeeze",
    version: "10.0",
    author: "xalman",
    role: 0,
    countDown: 10,
    shortDescription: "Squeeze image effect",
    longDescription: "Create a squeeze image with tagged user. Cost: 1000 balance per use.",
    category: "fun",
    guide: {
      en: "{pn} @mention\n{pn} reply\n{pn} uid"
    }
  },

  onStart: async function ({ api, event, message, usersData }) {

    api.setMessageReaction("🕜", event.messageID, () => {}, true);

    const senderID = event.senderID;

    const userData = await usersData.get(senderID);
    const balance = userData?.money || 0;

    if (balance < COST) {
      return message.reply(`❌ | You need ${COST} balance to use this command.`);
    }

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

    if (!targetID) return;

    if (targetID == access) return;

    await usersData.set(senderID, {
      money: balance - COST
    });

    try {
      const senderName = await usersData.getName(senderID).catch(() => "You");
      const targetName = await usersData.getName(targetID).catch(() => "Friend");

      const senderAvatar = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
      const targetAvatar = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;

      const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const [sImg, tImg, bgImg] = await Promise.all([
        Canvas.loadImage(senderAvatar),
        Canvas.loadImage(targetAvatar),
        Canvas.loadImage(bg)
      ]);

      const canvas = Canvas.createCanvas(713, 420);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const sP = { x: 98, y: 220, r: 40 };
      const tP = { x: 180, y: 170, r: 30 };

      const drawAvatar = (img, pos) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          pos.x - pos.r,
          pos.y - pos.r,
          pos.r * 2,
          pos.r * 2
        );
        ctx.restore();
      };

      drawAvatar(sImg, sP);
      drawAvatar(tImg, tP);

      const imgPath = path.join(
        __dirname,
        "tmp",
        `${senderID}_${targetID}.png`
      );

      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer());

      message.reply(
        {
          body: `${senderName} squeezed ${targetName} 🫦💸 -${COST} balance deducted`,
          attachment: fs.createReadStream(imgPath)
        },
        () => {
          fs.unlinkSync(imgPath);
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      );

    } catch (err) {
      console.error(err);
    }
  }
};
