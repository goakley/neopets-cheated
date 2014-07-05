"use strict";


function get_state() {
    // the order of these checks matter immensely
    if ($("center:contains('No one accused')").length === 1)
        return 'state.accusation.nobody';
    if ($("b:contains('NOT CHEATING!!!')").length === 1)
        return 'state.accusation.failure';
    if ($("center:contains('the pile added to')").length === 1)
        return 'state.accusation.success';
    if ($("option:contains('Select Card Value')").length === 1)
        return 'state.turn.player';
    if ($("b:contains('played')").length === 1)
        return 'state.turn.opponent';
    throw "Unable to determine game state";
}


function parse_state(state, data, callback) {
    if (state === 'state.turn.opponent') {
    }
    callback(data);
}


// when we're sent the game information, we can start working
self.port.on('data', function(data) {
    var state = get_state();
    console.info(state);
    parse_state(state, data, function(newdata) {
        // save the new information
        self.port.emit('data', newdata);
    });
});


// in order to get the game information, we have to identify ourselves
(function() {
    var username = $(".user a[href^='/userlookup']").text().trim();
    self.port.emit('username', username);
})();
