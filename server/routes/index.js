var express = require('express');
var router = express.Router();
var bot = bot = require('../bot');
module.exports = router;

// GET REPLY FROM THE CHAT BOT

router.get('/', function(req, res) {
  console.log('hit the route');
  res.send('<strong>Hi there</strong>');
});

router.post("/reply", function(req, res) {
  // Get data from the JSON post.
  console.log('in here', req)
  // var username = req.body.username;
  // var message = req.body.message;
  // var vars = req.body.vars;

  res.json(req.body);

  // // Make sure username and message are included.
  // if (typeof(username) === undefined || typeof(message) === undefined) {
  //   return error(res, "username and message are required keys");
  // }

  // // Copy any user vars from the post into RiveScript.
  // if (typeof(vars) !== undefined) {
  //   for (var key in vars) {
  //     if (vars.hasOwnProperty(key)) {
  //       bot.setUservar(username, key, vars[key]);
  //     }
  //   }
  // }

  // // Get a reply from the bot.
  // var reply = bot.reply(username, message, this);

  // // Get all the user's vars back out of the bot to include in the response.
  // vars = bot.getUservars(username);

  // // Send the JSON response.
  // res.json({
  //   "status": "ok",
  //   "reply": reply,
  //   "vars": vars
  // });
});

// Send a JSON error to the browser.
function error(res, message) {
  res.json({
    "status": "error",
    "message": message
  });
}