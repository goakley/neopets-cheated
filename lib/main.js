var data = require("sdk/self").data,
    pageMod = require("sdk/page-mod"),
    ss = require("sdk/simple-storage");


// when the index page is loaded, reset the user's game state
// this prevents issues with playing on another machine / browser
pageMod.PageMod({
    include: "http://www.neopets.com/games/cheat/index.phtml",
    contentScriptFile: [data.url("jquery-1.11.1.min.js"),
                        data.url("index.js")],
    onAttach: function(worker) {
        worker.port.on("username", function(username) {
            ss.storage[username] = {};
        });
    }
});


// when the cheat game page is loaded, send the correct state to the user
// also prepare to receive the new game state from the user
pageMod.PageMod({
    include: "http://www.neopets.com/games/cheat/cheat.phtml",
    contentScriptFile: [data.url("jquery-1.11.1.min.js"),
                        data.url("cheat.js")],
    onAttach: function(worker) {
        worker.port.on("username", function(username) {
            if (ss.storage[username] === undefined)
                ss.storage[username] = {};
            worker.port.on("data", function(data) {
                console.log(data);
                ss.storage[username] = data;
            });
            worker.port.emit("data", ss.storage[username]);
        });
    }
});
