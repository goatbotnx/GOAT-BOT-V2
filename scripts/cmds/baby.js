const axios = require('axios');
const baseApiUrl = async () => {
    return "https://noobs-api.top/dipto";
};

const utils = {
    monospace: (text) => {
        const monospaceMap = {
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
            'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
            'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
            'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
            'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            '0': '𝟶', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(char => monospaceMap[char] || char).join('');
    },
    realMention: (name, uid, message) => { 
        const finalMessage = `[ ${name} ]\n\n${message}`; 
        return { body: finalMessage, mentions: [{ tag: name, id: uid }] }; 
    }, 
    normalMention: (name, uid, message) => { 
        return { body: message, mentions: [{ tag: name, id: uid }] }; 
    }, 
    getRandomGreeting: () => { 
        const greetings = [""]; 
        return greetings[Math.floor(Math.random() * greetings.length)]; 
    }
};

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bot"],
    version: "10.1",
    author: "dipto cdi | xalman",
    countDown: 0,
    role: 0,
    description: "better than all sim simi api by dipto",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR \nall OR\nedit [YourMessage] - [NewMessage]"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const xalman = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const senderName = (await usersData.getName(uid)) || "User";

    try {
        if (!args[0]) {
            const ran = ["Bolo baby ❤️", "Type baby help", "Kichu bolooo", "Sunno ki?"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }
        if (args[0] === 'remove') {
            const fina = xalman.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${encodeURIComponent(fina)}&senderID=${uid}`)).data.message;
            return api.sendMessage(dat, event.threadID, event.messageID);
        }
        if (args[0] === 'rm' && xalman.includes('-')) {
            const [fi, f] = xalman.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${f}`)).data.message;
            return api.sendMessage(da, event.threadID, event.messageID);
        }
        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const limit = parseInt(args[2]) || 100;
                const limited = data?.teacher?.teacherList?.slice(0, limit);
                const teachers = await Promise.all(limited.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = await usersData.getName(number).catch(() => number) || "Not found";
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data;
                return api.sendMessage(`❇️ | Total Teach = ${d.length || "api off"}\n♻️ | Total Response = ${d.responseLength || "api off"}`, event.threadID, event.messageID);
            }
        }
        if (args[0] === 'msg') {
            const fuk = xalman.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${encodeURIComponent(fuk)}`)).data.data;
            return api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
        }
        if (args[0] === 'edit') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
            const dA = (await axios.get(`${link}?edit=${encodeURIComponent(args[1])}&replace=${encodeURIComponent(parts[1])}&senderID=${uid}`)).data.message;
            return api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] === 'react') {
            const parts = xalman.replace("teach react ", "").split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Invalid format! Use: teach react message - ❤️, 😀', event.threadID, event.messageID);
            const msg = parts[0].trim();
            const reacts = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&react=${encodeURIComponent(reacts)}`);
            return api.sendMessage(`✅ Reacts added: ${res.data.message}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] === 'amar') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Invalid format! Use: teach amar message - reply', event.threadID, event.messageID);
            const msg = parts[0].replace("teach amar ", "").trim();
            const reply = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&senderID=${uid}&reply=${encodeURIComponent(reply)}&key=intro`);
            return api.sendMessage(`✅ Intro reply added: ${res.data.message}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Invalid format! Use: teach message - reply1, reply2', event.threadID, event.messageID);
            const msg = parts[0].replace("teach ", "").trim();
            const replies = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(replies)}&senderID=${uid}&threadID=${event.threadID}`);
            const teacherName = (await usersData.get(res.data.teacher)).name || "Unknown";
            const outputMessage = utils.monospace(`✅ Replies added: ${res.data.message}\n👤 Teacher: ${teacherName}\n📚 Total Teachs: ${res.data.teachs}`);
            return api.sendMessage(outputMessage, event.threadID, event.messageID);
        }

        const resData = (await axios.get(`${link}?text=${encodeURIComponent(xalman)}&senderID=${uid}`)).data.reply;
        const replyText = utils.monospace(resData);
        api.sendMessage(replyText, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID, apiUrl: link });
        }, event.messageID);

    } catch (e) {
        console.log(e);
        api.sendMessage("Check console for error", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    try {
        if (event.type == "message_reply") {
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}`)).data.reply;
            const replyText = utils.monospace(a);
            await api.sendMessage(replyText, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
            }, event.messageID);
        }
    } catch (err) {
        return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";
        if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("jan") || body.startsWith("babu") || body.startsWith("alya")) {
            const arr = body.replace(/^\S+\s*/, "");
            const uid = event.senderID;
            const senderName = (await usersData.getName(uid)) || "User";
            const baseReplies = [
                "তোর তো বিয়ে হয় নাই বেবি পাইলি কই-🤦🏻", "পরকিয়া করছোছ নাকি শালা-🥲🤧", "কি খবর কেমনের আছো? 😊", "আজকে তো অনেক দিন পর কথা বলছো 😒",
                "কোথায় ছিলি এতদিন? 🤔", "তোকে ছাড়া বড় মন খারাপ লাগে 💔", "একটু হাসি না তোর হাসি দেখলে ভালো লাগে 💕", "তোরে খুব মিস করছি জানিস? 🥺",
                "তোর জন্য রোজ দোয়া করি ❤️", "তোকে পেয়ে আমি সত্যি ভাগ্যবান 😇", "তোর মুখে একটা মিষ্টি হাসি সবসময় থাকুক ✨", "তোকে খুব ভালোবাসি রে পাগল 💝",
                "তুই আমার জীবনের সবচেয়ে সুন্দর মানুষ 🌸", "তোর মতো বন্ধু পেয়ে আমি ধন্য 🙏", "তোর কথা ভাবলে মনটা শান্তি পায় 🕊️", "তুই আমার সেরা ক্রাশ 💘",
                "তোর জন্য আমি সবসময় আছি 🤗", "তুই আমার প্রাণের স্পন্দন 💓", "তোর স্মৃতি আমার চোখে ভাসে 🌙", "তোকে আল্লাহ আমার জন্য রেখেছে বলে বিশ্বাস হয় 🤲"
            ];

            if (!arr) {
                const randomReply = baseReplies[Math.floor(Math.random() * baseReplies.length)];
                const mentionObj = utils.realMention(senderName, uid, randomReply);
                await api.sendMessage(mentionObj, event.threadID, (error, info) => {
                    if (info) {
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
                    }
                }, event.messageID);
                return;
            }
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}`)).data.reply;
            const replyText = utils.monospace(a);
            await api.sendMessage(replyText, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
            }, event.messageID);
        }
    } catch (err) {
        console.error("onChat Error:", err);
    }
};
