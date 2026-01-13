/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

// 🔥 Fake web server for Render (REQUIRED)
const express = require("express");
const app = express();

app.get("/", (req, res) => {
	res.send("NX GoatBot is running on Render Web Service!");
});

// Render MUST detect a running web server
app.listen(process.env.PORT || 3000, () => {
	console.log("Web service running on port:", process.env.PORT || 3000);
});

// 🔥 GoatBot auto restart controller
function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();
