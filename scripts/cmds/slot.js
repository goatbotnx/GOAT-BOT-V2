module.exports = {
    config: {
        name: "slot",
        version: "2.0",
        author: "xalman",
        role: 0,
        countDown: 5,
        category: "game",
        guide: {
            en: "{pn} <amount>"
        }
    },

    onStart: async ({ message, event, args, usersData, api }) => {
        const { senderID, threadID } = event;

        function parseAmount(input) {
            if (!input) return NaN;
            let amount = input.toLowerCase();
            let res;
            if (amount.endsWith('k')) res = parseFloat(amount) * 1000;
            else if (amount.endsWith('m')) res = parseFloat(amount) * 1000000;
            else res = parseInt(amount);
            return res;
        }

        const betAmount = parseAmount(args[0]);
        const minBet = 100;
        const maxBet = 500000000;

        if (isNaN(betAmount) || betAmount < minBet) {
            return message.reply(`🎰 Minimum bet amount is ${minBet}৳.\nExample: /slot 100 or /slot 1k`);
        }

        if (betAmount > maxBet) {
            return message.reply("🚫 Maximum bet limit is 50M!");
        }

        const userData = await usersData.get(senderID);
        const currentMoney = userData.money;

        if (betAmount > currentMoney) {
            return message.reply(`💸 You don't have enough balance!\nCurrent balance: ${currentMoney}৳`);
        }

        if (!global.slotLimit) global.slotLimit = {};
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (!global.slotLimit[senderID]) {
            global.slotLimit[senderID] = { count: 0, lastReset: now };
        }

        if (now - global.slotLimit[senderID].lastReset > oneHour) {
            global.slotLimit[senderID] = { count: 0, lastReset: now };
        }

        if (global.slotLimit[senderID].count >= 200) {
            const timeLeft = Math.ceil((oneHour - (now - global.slotLimit[senderID].lastReset)) / (1000 * 60));
            return message.reply(`🚫 Limit reached! You've played 200 times this hour. Try again in ${timeLeft} minutes.`);
        }

        const items = ["🍎", "🍐", "🍑", "🍒", "🍓", "🍇", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭"];
        let s1, s2, s3;
        const winChance = Math.random() * 100;

        if (winChance <= 60) {
            s1 = items[Math.floor(Math.random() * items.length)];
            s2 = s1; 
            s3 = items[Math.floor(Math.random() * items.length)];
        } else {
            s1 = items[Math.floor(Math.random() * items.length)];
            s2 = items[Math.floor(Math.random() * items.length)];
            while(s2 === s1) s2 = items[Math.floor(Math.random() * items.length)];
            s3 = items[Math.floor(Math.random() * items.length)];
        }

        global.slotLimit[senderID].count++;

        const sentMessage = await message.reply(`🎰 | SLOT MACHINE\n──────────────\n       [ ${s1} | ❓ | ❓ ]\n──────────────\n⌛ Spinning...`);
        const msgID = sentMessage.messageID;

        await new Promise(resolve => setTimeout(resolve, 1200));
        await api.editMessage(`🎰 | SLOT MACHINE\n──────────────\n       [ ${s1} | ${s2} | ❓ ]\n──────────────\n⌛ Spinning...`, msgID, threadID);

        await new Promise(resolve => setTimeout(resolve, 1200));

        let win = false;
        let bonus = 0;
        let finalMoney = currentMoney;

        if (s1 === s2 && s2 === s3) {
            win = true;
            bonus = betAmount * 3;
            finalMoney += bonus;
        } else if (s1 === s2 || s1 === s3 || s2 === s3) {
            win = true;
            bonus = Math.floor(betAmount * 1.5);
            finalMoney += bonus;
        } else {
            win = false;
            finalMoney -= betAmount;
        }

        await usersData.set(senderID, { money: finalMoney });

        const status = win ? "WINNER! 🎉" : "LOST! 💀";
        const resultMsg = win ? `You won: ${bonus}৳` : `You lost: ${betAmount}৳`;

        return api.editMessage(`🎰 | SLOT MACHINE\n──────────────\n       [ ${s1} | ${s2} | ${s3} ]\n──────────────\n📢 ${status}\n💰 ${resultMsg}\n💳 Balance: ${finalMoney}৳\n📊 Usage: ${global.slotLimit[senderID].count}/200 (this hour)`, msgID, threadID);
    }
};
