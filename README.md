# Neopets Cheated

Neopets Cheated is a Firefox addon that tracks the status of Neopets "Cheat!" games to give the player a better chance of winning.

# System

## Behaviour

When someone is (possibly) cheating, a message will be displayed above the "accuse / slide" options, letting the player know of the current situation.

## Tracking Methods

### Certain Cheat Detection

Using the player's hand and the known pile makes it easy to determine if an opponent is definitely cheating.

### Possible Cheat Detection

The system currently doesn't track the cards that have been given to other players.  However, if this were implemented, it would be possible to determine how likely it is that someone is cheating.  For example, if we know we gave Branston 3 threes somehow, and it comes his turn and he plays 3 threes, it is likely (but not certain) that he played the 3 threes we gave him.  That knowledge can build up a 'might be cheating' value.