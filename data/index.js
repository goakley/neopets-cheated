(function() {
    var username = $(".user a[href^='/userlookup']").text().trim();
    self.port.emit('username', username);
})();
