const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "cache", "autoAccept.json");

if (!fs.existsSync(path.dirname(configPath))) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
}

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({}));
}

module.exports = {
  config: {
    name: "autoacp",
    aliases: ["autoaccecpt", "aacp"],
    version: "1.0",
    author: "xalman",
    countDown: 5,
    role: 2,
    shortDescription: "Auto accept friend request",
    longDescription: "Automatically accept friend requests every 10 minutes",
    category: "utility"
  },

  onStart: async function ({ api, event, args }) {
    const data = JSON.parse(fs.readFileSync(configPath));
    const senderID = event.senderID;

    if (!args[0]) {
      return api.sendMessage(
        "Use:\nautoaccept on\nautoaccept off\nautoaccept status",
        event.threadID,
        event.messageID
      );
    }

    if (args[0] === "on") {
      if (data[senderID]?.status) {
        return api.sendMessage(
          "Auto accept already enabled.",
          event.threadID,
          event.messageID
        );
      }

      data[senderID] = {
        status: true
      };

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

      startAutoAccept(api, senderID);

      return api.sendMessage(
        "✅ Auto friend request accept enabled.\nChecks every 10 minutes.",
        event.threadID,
        event.messageID
      );
    }

    if (args[0] === "off") {
      if (!data[senderID]) data[senderID] = {};

      data[senderID].status = false;

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

      return api.sendMessage(
        "❌ Auto friend request accept disabled.",
        event.threadID,
        event.messageID
      );
    }

    if (args[0] === "status") {
      return api.sendMessage(
        data[senderID]?.status
          ? "✅ Auto accept is ON"
          : "❌ Auto accept is OFF",
        event.threadID,
        event.messageID
      );
    }
  },

  onLoad: async function ({ api }) {
    const data = JSON.parse(fs.readFileSync(configPath));

    for (const userID in data) {
      if (data[userID].status) {
        startAutoAccept(api, userID);
      }
    }
  }
};

const intervals = {};

function startAutoAccept(api, userID) {
  if (intervals[userID]) return;

  intervals[userID] = setInterval(async () => {
    try {
      const data = JSON.parse(fs.readFileSync(configPath));

      if (!data[userID] || !data[userID].status) {
        clearInterval(intervals[userID]);
        delete intervals[userID];
        return;
      }

      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name:
          "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({
          input: {
            scale: 3
          }
        })
      };

      const res = JSON.parse(
        await api.httpPost(
          "https://www.facebook.com/api/graphql/",
          form
        )
      );

      const listRequest =
        res.data.viewer.friending_possibilities.edges || [];

      if (!listRequest.length) return;

      for (const user of listRequest) {
        try {
          const acceptForm = {
            av: api.getCurrentUserID(),
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name:
              "FriendingCometFriendRequestConfirmMutation",
            doc_id: "3147613905362928",
            variables: JSON.stringify({
              input: {
                source: "friends_tab",
                actor_id: api.getCurrentUserID(),
                client_mutation_id: Math.round(
                  Math.random() * 19
                ).toString(),
                friend_requester_id: user.node.id
              },
              scale: 3,
              refresh_num: 0
            })
          };

          await api.httpPost(
            "https://www.facebook.com/api/graphql/",
            acceptForm
          );

          console.log(
            `[ AUTO ACCEPT ] Accepted: ${user.node.name}`
          );
        } catch (err) {
          console.log(
            `[ AUTO ACCEPT ERROR ] ${user.node.name}`
          );
        }
      }
    } catch (e) {
      console.log("[ AUTO ACCEPT ERROR ]", e);
    }
  }, 10 * 60 * 1000);
}
