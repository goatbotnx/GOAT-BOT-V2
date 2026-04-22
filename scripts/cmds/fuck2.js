const xalman_fs = require("fs-extra");
const xalman_Canvas = require("canvas");
const xalman_path = require("path");

const xalman_TOKEN = "350685531728|62f8ce9f74b12f84c123cc23437a4a32";

const xalman_access = ["61570641868681", "61574478201014"];

const xalman_backgrounds = [
  "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/xalman/xalmanimg/images/fuck2.jpg"
];

module.exports = {
  config: {
    name: "fuck2",
    version: "3.2",
    author: "xalman",
    role: 0,
    countDown: 5,
    shortDescription: "get 2 profile picture and generate NSFW fuck image using canvas",
    longDescription: "Create image",
    category: "fun",
    guide: { en: "{pn} @mention | reply | uid" }
  },

  onStart: async function ({ api, event, message, usersData }) {

    api.setMessageReaction("🕜", event.messageID, () => {}, true);

    const xalman_sender = event.senderID;
    let xalman_target = null;

    if (event.messageReply?.senderID) {
      xalman_target = event.messageReply.senderID;
    } 
    else if (Object.keys(event.mentions || {}).length > 0) {
      xalman_target = Object.keys(event.mentions)[0];
    } 
    else {
      const xalman_match = event.body?.match(/\b\d{8,20}\b/);
      if (xalman_match) xalman_target = xalman_match[0];
    }

    if (!xalman_target) {
      return message.reply("❌");
    }

    if (xalman_access.includes(xalman_target)) {
      return message.reply("🚫");
    }

    try {
      const xalman_name1 = await usersData.getName(xalman_sender).catch(() => "You");
      const xalman_name2 = await usersData.getName(xalman_target).catch(() => "Friend");

      const xalman_avatar1 = `https://graph.facebook.com/${xalman_sender}/picture?width=512&height=512&access_token=${xalman_TOKEN}`;
      const xalman_avatar2 = `https://graph.facebook.com/${xalman_target}/picture?width=512&height=512&access_token=${xalman_TOKEN}`;

      const xalman_bg = xalman_backgrounds[Math.floor(Math.random() * xalman_backgrounds.length)];

      const [xalman_img1, xalman_img2, xalman_bgImg] = await Promise.all([
        xalman_Canvas.loadImage(xalman_avatar1),
        xalman_Canvas.loadImage(xalman_avatar2),
        xalman_Canvas.loadImage(xalman_bg)
      ]);

      const xalman_canvas = xalman_Canvas.createCanvas(xalman_bgImg.width, xalman_bgImg.height);
      const xalman_ctx = xalman_canvas.getContext("2d");

      xalman_ctx.drawImage(xalman_bgImg, 0, 0);

      const xalman_p1 = { x: 510, y: 280, r: 100 };
      const xalman_p2 = { x: 600, y: 485, r: 90 };

      const xalman_draw = (img, pos) => {
        xalman_ctx.save();
        xalman_ctx.beginPath();
        xalman_ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        xalman_ctx.closePath();
        xalman_ctx.clip();
        xalman_ctx.drawImage(
          img,
          pos.x - pos.r,
          pos.y - pos.r,
          pos.r * 2,
          pos.r * 2
        );
        xalman_ctx.restore();
      };

      xalman_draw(xalman_img1, xalman_p1);
      xalman_draw(xalman_img2, xalman_p2);

      const xalman_file = xalman_path.join(__dirname, "tmp", `${xalman_sender}_${xalman_target}.png`);

      await xalman_fs.ensureDir(xalman_path.dirname(xalman_file));
      xalman_fs.writeFileSync(xalman_file, xalman_canvas.toBuffer());

      message.reply(
        {
          body: `${xalman_name1} ƒυ¢кє∂ ${xalman_name2}🥵🫦`,
          attachment: xalman_fs.createReadStream(xalman_file)
        },
        () => {
          xalman_fs.unlinkSync(xalman_file);
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      );

    } catch {
      message.reply("❌");
    }
  }
};
