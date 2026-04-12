const axios = require("axios");

const filters = [
  "grayscale","invert","auto_contrast","solarize","posterize",
  "blur","gaussian_blur","box_blur",
  "sharpen","edge","emboss","detail","contour",
  "rotate","rotate_180","flip_lr","flip_tb",
  "brightness_up","brightness_down","contrast_high","contrast_low",
  "color_boost","warm","cool",
  "pixelate","mirror","comic"
];

module.exports = {
  config: {
    name: "imagefilter",
    aliases: ["filter", "imgfilter"],
    version: "2.0",
    author: "xalman",
    countDown: 3,
    role: 0,
    shortDescription: "get 27 Image filter by xalman",
    category: "image"
  },

  onStart: async function ({ message, args, event, api }) {
    try {

      if (args[0] === "list") {
        let list = "Filters List:\n\n";
        filters.forEach((f, i) => {
          list += `${i + 1}. ${f}\n`;
        });
        return message.reply(list);
      }

      if (!args[0]) {
        return message.reply("Use: filter <name/number> <url> or reply image");
      }

      let filterInput = args[0];
      let filter;

      if (!isNaN(filterInput)) {
        let index = parseInt(filterInput) - 1;
        if (index < 0 || index >= filters.length) {
          return message.reply("Invalid filter number");
        }
        filter = filters[index];
      } else {
        filter = filterInput;
      }

      let imageUrl = args[1];

      if (!imageUrl && event.messageReply?.attachments?.length > 0) {
        let attach = event.messageReply.attachments[0];
        if (attach.type === "photo") {
          imageUrl = attach.url;
        }
      }

      if (!imageUrl) {
        return message.reply("Provide image URL or reply to an image");
      }

      const apiUrl = `https://xalman-image-filter.vercel.app/filter?image_url=${encodeURIComponent(imageUrl)}&filter_type=${filter}`;

      const res = await axios.get(apiUrl, { responseType: "stream" });

      return message.reply({
        body: `Filter: ${filter}`,
        attachment: res.data
      });

    } catch (e) {
      return message.reply("Error");
    }
  }
};
