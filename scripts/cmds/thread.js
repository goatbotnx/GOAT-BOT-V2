const { getTime } = global.utils;

module.exports = {
    config: {
        name: "thread",
        version: "2.5.0",
        author: "ntkhanki | xalman",
        countDown: 3,
        role: 0,
        description: {
            en: "Elite System Management: Thread Control & Analytics"
        },
        category: "System",
        guide: {
            en: " [ 🛠️ ] Usage Guide:" +
                "\n ❯ {pn} find <name> -> Locate specific group" +
                "\n ❯ {pn} ban <tid> <reason> -> Blacklist group" +
                "\n ❯ {pn} unban <tid> -> Restore group access" +
                "\n ❯ {pn} left <tid> -> Force bot evacuation" +
                "\n ❯ {pn} info <tid> -> Extract group metadata"
        }
    },

    langs: {
        en: {
            unauthorized: "⛔ [ ACCESS DENIED ] : Elevated privileges required.",
            searchSuccess: "🔍 [ DATABASE SEARCH ]\nFound %1 matches for keyword: \"%2\"\n━━━━━━━━━━━━━━━━━━\n%3",
            searchFail: "❌ [ NULL RESULT ] : No group identity matches \"%1\".",
            banConfirm: "🚫 [ BLACKLISTED ]\nID: %1\nLabel: %2\nReason: %3\nTimestamp: %4",
            alreadyBanned: "⚠️ [ RE-ENTRY BLOCKED ]\nID: %1 | Name: %2\nReason: %3\nDate: %4",
            unbanConfirm: "✅ [ ACCESS RESTORED ] : Thread [%1 | %2] is now whitelisted.",
            leaveConfirm: "📤 [ EVACUATION COMPLETE ]\nGroup: %1\nID: %2\nStatus: Successfully disconnected.",
            missingField: "⚠️ [ INPUT ERROR ] : Argument or Reason is missing.",
            statsDisplay: "📊 [ THREAD ANALYTICS ]\n━━━━━━━━━━━━━━━━━━\n◈ Thread ID: %1\n◈ Identity: %2\n◈ Initialized: %3\n◈ Population: %4 souls\n◈ Metrics: %5 ♂️ | %6 ♀️\n◈ Activity: %7 total packets%8",
            execError: "❗ [ RUNTIME ERROR ] : %1"
        }
    },

    onStart: async function ({ args, threadsData, message, role, event, getLang, api }) {
        const action = args[0]?.toLowerCase();
        if (!action) return message.SyntaxError();

        // Admin Protocol Check
        const secureProtocol = ["find", "ban", "unban", "left", "out"];
        if (secureProtocol.includes(action) && role < 2) {
            return message.reply(getLang("unauthorized"));
        }

        const targetID = !isNaN(args[1]) ? args[1] : event.threadID;

        switch (action) {
            case "find":
            case "search": {
                const query = args.slice(1).join(" ");
                const vault = await threadsData.getAll();
                const filtered = vault.filter(t => (t.threadName || "").toLowerCase().includes(query.toLowerCase()));
                
                if (filtered.length === 0) return message.reply(getLang("searchFail", query));
                
                const list = filtered.map(t => ` ↳「 ${t.threadName} 」\n    ID: ${t.threadID}`).join("\n");
                return message.reply(getLang("searchSuccess", filtered.length, query, list));
            }

            case "ban": {
                const banID = !isNaN(args[1]) ? args[1] : event.threadID;
                const reasonStr = !isNaN(args[1]) ? args.slice(2).join(" ") : args.slice(1).join(" ");

                if (!reasonStr) return message.reply(getLang("missingField"));
                
                const data = await threadsData.get(banID);
                if (data.banned?.status) {
                    return message.reply(getLang("alreadyBanned", banID, data.threadName, data.banned.reason, data.banned.date));
                }

                const stamp = getTime("DD/MM/YYYY HH:mm:ss");
                await threadsData.set(banID, { 
                    banned: { status: true, reason: reasonStr, date: stamp } 
                });
                return message.reply(getLang("banConfirm", banID, data.threadName, reasonStr, stamp));
            }

            case "unban": {
                const info = await threadsData.get(targetID);
                await threadsData.set(targetID, { banned: {} });
                return message.reply(getLang("unbanConfirm", targetID, info.threadName));
            }

            case "left":
            case "out": {
                try {
                    const info = await threadsData.get(targetID);
                    const groupName = info?.threadName || "Unidentified Thread";
                    
                    return message.reply(getLang("leaveConfirm", groupName, targetID), () => {
                        api.removeUserFromGroup(global.GoatBot.botID, targetID);
                    });
                } catch (err) {
                    return message.reply(getLang("execError", err.message));
                }
            }

            case "info": {
                const d = await threadsData.get(targetID);
                if (!d) return message.reply("❌ Error: Core data corrupted or not found.");

                const genesis = getTime(d.createdAt, "DD/MM/YYYY HH:mm:ss");
                const users = Object.values(d.members || {}).filter(m => m.inGroup);
                const mCount = users.filter(m => m.gender === "MALE").length;
                const fCount = users.filter(m => m.gender === "FEMALE").length;
                const totalLogs = users.reduce((sum, m) => sum + (m.count || 0), 0);
                
                const banStatus = d.banned?.status ? 
                    `\n━━━━━━━━━━━━━━━━━━\n⚠️ SECURITY ALERT: BANNED\n↳ Reason: ${d.banned.reason}` : "";

                return message.reply(getLang("statsDisplay", targetID, d.threadName, genesis, users.length, mCount, fCount, totalLogs, banStatus));
            }

            default:
                return message.SyntaxError();
        }
    }
};
