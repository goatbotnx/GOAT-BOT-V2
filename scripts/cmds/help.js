const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "〲 𝗠𝗔𝗬𝗕𝗘 𝗡𝗫 〲";

module.exports = {
 config: {
 name: "help",
 version: "1.25",
 author: "xalman",
 countDown: 5,
 role: 0,
 shortDescription: { en: "View command usage" },
 longDescription: { en: "View command usage" },
 category: "info",
 guide: { en: "{pn} [page | command name]" },
 priority: 1
 },

 langs: {
 en: {
 help2: "╭━━━ ◆ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧 ◆ ━━━╮\n\n%1\n\n╰━━━━━━━━━━━━━━━━━━━━╯\n📖 𝗣𝗮𝗴𝗲: [ %2 / %3 ]\n📊 𝗧𝗼𝘁𝗮ｌ: %4 𝗖𝗺𝗱𝘀\n💡 𝗨𝘀𝗲: %5𝐡𝐞𝐥𝐩 <𝐧𝐮𝐦>\n━━━━━━━━━━━━━━━━━━━━\n👤 %6",
 
 help: "┏━━━━━━━ ⚡ 𝗠𝗘𝗡𝗨 ━━━━━━━┓\n%1\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n◈ 𝗧𝗼𝘁𝗮ｌ: %2 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀\n◈ 𝗣𝗿𝗲𝗳𝗶𝘅: [ %3 ]\n✨ %4",

 commandNotFound: "⚠️ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 \"%1\" 𝗻𝗼𝘁 𝗳𝗼𝘂𝗻𝗱!",

 getInfoCommand: "╭─────── ✧ 𝗜𝗡𝗙𝗢 ✧ ───────⦿\n│ 🏷️ 𝗡𝗮𝗺𝗲: %1\n│ 📝 𝗗𝗲𝘀𝗰: %2\n│ 🖇️ 𝗔𝗹𝗶𝗮𝘀: %3\n│ 🧬 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: %4\n│ 🛡️ 𝗣𝗲𝗿𝗺𝗶𝘀: %5\n│ ⏳ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: %6𝘀\n│ 👤 𝗔𝘂𝘁𝗵𝗼𝗿: %7\n╰────────────────────⦿\n╭─────── 📖 𝗨𝗦𝗔𝗚𝗘 ──────⦿\n│ %8\n╰────────────────────⦿",
 pageNotFound: "❌ Page %1 is out of range!"
 }
 },

 onStart: async function ({ message, args, event, threadsData, getLang, role }) {
 const langCode = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
 const { threadID } = event;
 const threadData = await threadsData.get(threadID);
 const prefix = getPrefix(threadID);
 
 const commandName = (args[0] || "").toLowerCase();
 const command = commands.get(commandName) || commands.get(aliases.get(commandName));

 if (!command && (!args[0] || !isNaN(args[0]))) {
 const arrayInfo = [];
 let msg = "";
 
 if (!isNaN(args[0]) || (threadData.settings && threadData.settings.sortHelp === "name")) {
 const page = parseInt(args[0]) || 1;
 const numberOfOnePage = 20;
 
 for (const [name, value] of commands) {
 if (value.config.role > role) continue;
 arrayInfo.push({ data: name, priority: value.priority || 0 });
 }
 
 arrayInfo.sort((a, b) => b.priority - a.priority || a.data.localeCompare(b.data));
 const { allPage, totalPage } = global.utils.splitPage(arrayInfo, numberOfOnePage);
 if (page < 1 || page > totalPage) return message.reply(getLang("pageNotFound", page));

 msg = allPage[page - 1].reduce((text, item, index) => text += ` ❯ ${(page-1)*numberOfOnePage + index + 1}. ${item.data}\n`, "");
 return message.reply(getLang("help2", msg, page, totalPage, arrayInfo.length, prefix, doNotDelete));
 } 
 else {
 const categories = {};
 for (const [, value] of commands) {
 if (value.config.role > role) continue;
 const cat = value.config.category?.toUpperCase() || "OTHERS";
 if (!categories[cat]) categories[cat] = [];
 categories[cat].push(value.config.name);
 }

 Object.keys(categories).sort().forEach(cat => {
 msg += `\n┌──『 ${cat} 』\n└➤ ${categories[cat].sort().map(n => n).join(", ")}\n`;
 });

 return message.reply(getLang("help", msg, commands.size, prefix, doNotDelete));
 }
 }

 if (!command) return message.reply(getLang("commandNotFound", args[0]));

 const config = command.config;
 let guide = config.guide?.[langCode] || config.guide?.en || "";
 if (typeof guide === "object") guide = guide.body;
 const usage = guide.replace(/\{pn\}/g, prefix + config.name).replace(/\{p\}/g, prefix);
 
 return message.reply(getLang("getInfoCommand", 
 config.name.toUpperCase(), 
 config.shortDescription?.[langCode] || config.shortDescription?.en || "No Description", 
 config.aliases?.join(", ") || "None", 
 config.version || "1.0.0", 
 config.role == 0 ? "All Users" : config.role == 1 ? "Admins" : "Bot Owner", 
 config.countDown || 1, 
 config.author || "Unknown", 
 usage.split("\n").map(line => ` » ${line}`).join("\n")
 ));
 }
};
