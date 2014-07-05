// TODO: Add the ability to track opponent's cards that they've picked up
// We only blindly assign them cards, but don't use them
// It is tricky to track if an opponent might have played one of the cards
// that we know they have
// and my brain is not ready for that yet


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
    var move = $("b:contains('played')").text().split(' played ');
    var opponent = move[0].trim();
    var count = parseInt(move[1].split(' ')[0]);
    var card = move[1].split(' ')[1].toLowerCase();
    if (count > 1) {
        if (card === 'sixes') {
            // dumb special case...
            card = 'six';
        } else {
            card = card.slice(0,-1);
        }
    }
    data['turn'] = {card:card, count:count};
    // determine if an opponent is cheating
    if (count + data['pile'][card] + data['player']['hand'][card] > 4) {
        $("form[name='cardform']").prepend('<p style="font-weight:bold;color:">' + opponent + ' is definitely cheating!</p>');
    }
    return data;
}

function state_accusation_success(data) {
    // who got caught?
    var opponent = $("center:contains('gets the pile added to their hand')");
    // opponent got caught
    if (opponent.length === 1) {
        // identify the opponent
        opponent = opponent.text();
        opponent = opponent.slice(
            opponent.indexOf('!!!') + 3,
            opponent.indexOf(' gets the pile added to their hand')
        );
        if (data['opponents'][opponent] === undefined) {
            data['opponents'][opponent] = new_opponent();
        }
        // give the opponent all the cards that were played
        for (var card in data['pile']) {
            data['opponents'][opponent]['hand'][card] = data['pile'][card];
        }
    }
    // we got caught
    // don't worry about it, we'll calculate our hand next state
    data['pile'] = new_hand();
    return data;
}

function state_accusation_failure(data) {
    // who failed an accusation?
    var opponent = $("center:contains('gets the pile added to their hand')");
    // opponent failed
    if (opponent.length === 1) {
        // make sure there's enough historical data to work
        if (data['turn'] === undefined) {
            return data;
        }
        // identify the opponent
        opponent = opponent.text().trim();
        opponent = opponent.slice(0, opponent.indexOf(" accused"));
        if (data['opponents'][opponent] === undefined)
            data['opponents'][opponent] = new_opponent();
        // give the opponent all the cards that were played
        for (var card in data['pile']) {
            data['opponents'][opponent]['hand'][card] = data['pile'][card];
        }
        // plus what was played by the opponent
        data['opponents'][opponent]['hand'][data['turn']['card']] += data['turn']['count'];
    }
    // we failed
    // don't worry about it, we'll calculate our hand next state
    data['pile'] = new_hand();
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
        else if (state === 'state.turn.opponent') {
            data = state_turn_opponent(data);
        }
        else {
            throw 'Discovered unknown state';
        }
    }
    else if (state.indexOf('state.accusation') === 0) {
        // combine the player's just played hand with the pile
        for (var card in data['pile'])
            data['pile'][card] += data['player']['just_played'][card];
        data['player']['just_played'] = new_hand();
        // process the state
        if (state === 'state.accusation.nobody') {
            // actually, nothing really to do here
            delete data['turn'];
        }
        else if (state === 'state.accusation.success') {
            data = state_accusation_success(data);
        }
        else if (state === 'state.accusation.failure') {
            data = state_accusation_failure(data);
        }
        else {
            throw 'Discovered unknown state';
        }
    }
    callback(data);
}


// when we're sent the game information, we can start working
self.port.on('data', function(data) {
    var state = get_state();
    //console.log(state);
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
