app.factory('ChatFactory', function() {

  var messageCache = [];

  return {
    getMessages: function() {
      return messageCache;
    },
    postMessage: function(message) {
      messageCache.push(message);
    },
    clearAllMessages: function() {
      messageCache = [];
    }
  };
});
