function int_to_card(n) {
    switch(n) {
    case 1: return 'ace';
    case 2: return 'two';
    case 3: return 'three';
    case 4: return 'four';
    case 5: return 'five';
    case 6: return 'six';
    case 7: return 'seven';
    case 8: return 'eight';
    case 9: return 'nine';
    case 10: return 'ten';
    case 11: return 'jack';
    case 12: return 'queen';
    case 12: return 'king';
    }
    return null;
}

function click_to_suitcard(n) { return n.slice(n.indexOf("'") + 1, n.lastIndexOf("'")); }

// 'C11' -> 11
function suitcard_to_card(n) { return int_to_card(parseInt(n.slice(1))); }

function click_to_card(n) { return suitcard_to_card(click_to_suitcard(n)); }


function new_hand() {
    return {
        'ace': 0,
        'one': 0,
        'two': 0,
        'three': 0,
        'four': 0,
        'five': 0,
        'six': 0,
        'seven': 0,
        'eight': 0,
        'nine': 0,
        'ten': 0,
        'jack': 0,
        'queen': 0,
        'king': 0
    };
}

function new_opponent() {
    return {
        'hand': new_hand()
    };
}

function new_data() {
    return {
        'player': {
            'hand': new_hand(),
            'played': new_hand(),
            'just_played': new_hand()
        },
        'opponents': {},
        'pile': new_hand()
    };
}


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



function state_turn_player(data, callback) {
    console.log(data);
    // clear the selected cards
    data['player']['just_played'] = new_hand();
    var suitcards = [];
    // when a card is selected, update the game state
    $("td[width=85]").click(function() {
        var suitcard = click_to_suitcard($(this).find('a').attr('onclick'));
        var index = $.inArray(suitcard, suitcards);
        if (index === -1) {
            // don't go over the limit of 4 cards
            if (suitcards.length === 4)
                return;
            suitcards.push(suitcard);
            data['player']['just_played'][suitcard_to_card(suitcard)]++;
            data['player']['hand'][suitcard_to_card(suitcard)]--;
        } else {
            suitcards.splice(index, 1);
            data['player']['just_played'][suitcard_to_card(suitcard)]--;
            data['player']['hand'][suitcard_to_card(suitcard)]++;
        }
        callback(data);
    });
}

function state_turn_opponent(data) {
    // record the last played cards
    var move = $("b:contains('played')").text().split(' played ')[1];
    var count = parseInt(move.split(' ')[0]);
    var card = move.split(' ')[1].toLowerCase();
    if (count > 1) {
        if (card === 'sixes') {
            // dumb special case...
            card = 'six';
        } else {
            card = card.slice(0,-1);
        }
    }
    data['previous'] = {card:card, count:count};
    return data;
}


function parse_state(state, data, callback) {
    if (state.indexOf('state.turn') === 0) {
        // ensure the opponents are correctly loaded
        var ops = $(".content div table tr:first td[align='center']");
        for (var i = 0; i < ops.length; i++) {
            var text = $(ops[i]).text().split('has');
            var opponent = text[0].trim();
            if (data['opponents'][opponent] === undefined)
                data['opponents'][opponent] = new_opponent();
            data['opponents'][opponent]['count'] = parseInt(text[1].trim().split(' ')[0]);
        }
        // ensure our hand is correct
        data['player']['hand'] = new_hand();
        $("center img[width=70]").each(function() {
            data['player']['hand'][suitcard_to_card($(this).attr('name'))]++;
        });
        // process the state
        if (state === 'state.turn.player') {
            state_turn_player(data, callback);
            return;
        }
        if (state === 'state.turn.opponent') {
            data = state_turn_opponent(data);
        }
    }
    else if (state.indexOf('state.accusation') === 0) {
        // combine the player's just played hand with the pile
        for (var card in data['pile'])
            data['pile'][card] += data['player']['just_played'][card];
        data['player']['just_played'] = new_hand();
        // process the state
    }
    callback(data);
}


// when we're sent the game information, we can start working
self.port.on('data', function(data) {
    var state = get_state();
    console.log(state);
    if (data['player'] === undefined)
        data = new_data();
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
