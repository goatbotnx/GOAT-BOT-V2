const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "file",
		version: "3.0",
		author: "xalmam",
		countDown: 2,
		role: 0,
		shortDescription: "Send bot script",
		longDescription: "Send bot specified file",
		category: "owner",
		guide: "{pn} <file name>"
	},

	onStart: async function ({ message, args, api, event }) {

		const permission = ["100081088184521", "61583129938292"];
		if (!permission.includes(event.senderID)) {
			return api.sendMessage("Access denied.", event.threadID, event.messageID);
		}

		const fileName = args[0];
		if (!fileName) {
			return api.sendMessage("Please provide a file name.", event.threadID, event.messageID);
		}

		const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".js"));
		const filePath = path.join(__dirname, `${fileName}.js`);

		if (!fs.existsSync(filePath)) {

			const suggestions = files.filter(f =>
				f.toLowerCase().includes(fileName.toLowerCase())
			);

			if (suggestions.length > 0) {
				return api.sendMessage(
					`File not found: ${fileName}.js\n\nDid you mean:\n- ${suggestions.join("\n- ")}`,
					event.threadID,
					event.messageID
				);
			}

			return api.sendMessage(
				`File not found: ${fileName}.js\n\nAvailable files:\n- ${files.join("\n- ")}`,
				event.threadID,
				event.messageID
			);
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');
		return api.sendMessage({ body: fileContent }, event.threadID);
	}
};
