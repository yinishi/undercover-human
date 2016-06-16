var RiveScript = require("rivescript");

// CREATE THE BOT
var bot = new RiveScript();

function success_handler(loadcount) {
    console.log("Load #" + loadcount + ": Bot loaded!");
    bot.sortReplies();
}

function error_handler(loadcount, err) {
    console.log("Error loading batch #" + loadcount + ": " + err + "\n");
}

// EXPORT THE BOT
module.exports = {bot, success_handler, error_handler};


// // /* CURL COMMAND

// //  curl -i    -H "Content-Type: application/json"    -X POST -d '{"username":"soandso","message":"hi","vars":{"name":"Soandso"}}'    http://localhost:1337/bot/reply

