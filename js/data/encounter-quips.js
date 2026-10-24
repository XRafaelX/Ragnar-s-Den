/* ---------------- Encounter quips ----------------
   The jokes the combat tracker tells the DM. Each list is one moment of
   a fight. The tracker picks a line at random, never the same one twice
   in a row. Every line still says what happened, so a joke never hides
   the news.
   Fill-ins: {name} the monster ("Goblin 2"), {kind} what it is in lower
   case ("goblin"), {dmg} the damage dealt, {left} the hit points it had
   before the hit, {over} how much more than that, {hp} the hit points it
   has now, {round} the round, {enc} the encounter's name. */
export var ENCOUNTER_QUIPS = {
  // Damage on a monster that's already down. Nothing happens.
  dead: [
    "{name} is already dead. Let it rest in pieces.",
    "{name} can't get any deader than this.",
    "That's beating a dead {kind}.",
    "Overkill noted. {name} was already dead.",
    "You hit the corpse of {name}. The corpse doesn't mind.",
    "{name} has left the fight. Spiritually and physically.",
    "The bard is writing a song about how you kept hitting {name} after it died.",
    "{name} is dead, Panai.",
    "Even the necromancer says {name} has had enough.",
    "{name} files a complaint from the afterlife.",
    "Breaking news: {name} is still dead.",
    "{name}'s ghost would like a word with you.",
    "Panai, {name} has been dead for a while. The players noticed.",
    "That {kind} is now mostly paperwork.",
    "The vultures ask you to leave some of {name} for them.",
    "Fun fact: hitting {name} now gives zero experience.",
    "Somewhere, a cleric sighs at what you are doing to {name}.",
    "{name} was dead before you started. It's even more dead now."
  ],
  // A monster goes down (sometimes, in place of "{name} is down.").
  slain: [
    "{name} is down. The dice gods are pleased.",
    "{name} goes down with a dramatic final scream.",
    "Down goes {name}. Ask the player how they want to do this.",
    "{name} is down. Its family will hear about this.",
    "{name} drops. One less thing trying to eat the party.",
    "{name} is down. Loot later, Panai. Fight first.",
    "{name} is down and out. Mostly out.",
    "{name} has been defeated. Mark it on the map.",
    "{name} hits the floor. The floor wins."
  ],
  // From full hit points to 0 in one hit.
  oneShot: [
    "One hit. {name} never stood a chance.",
    "{name} went from full health to the floor in one hit.",
    "{name} didn't even see it coming.",
    "One blow, one {kind}. Efficient.",
    "Panai, maybe give the next {kind} a few more hit points."
  ],
  // Far more damage than it had left.
  overkill: [
    "{dmg} damage on a {kind} with {left} HP left. Overkill by {over}.",
    "{name} needed {left} damage. It got {dmg}. There isn't much left.",
    "{over} points of overkill. {name} is now a fine mist.",
    "That was {dmg} damage. {name} only had {left} hit points. Respect."
  ],
  // Exactly the damage it had left.
  exact: [
    "Exactly {left} damage. Not a single hit point wasted. {name} is down.",
    "{left} damage on a {kind} with {left} HP. Perfect aim. {name} is down.",
    "{name} is down to exactly 0. The party's accountant approves."
  ],
  // Left on 1 hit point.
  low: [
    "{name} is hanging on by 1 hit point.",
    "1 hit point left. {name} is thinking about running.",
    "{name} has 1 HP and a lot of regrets.",
    "One more poke and {name} is done."
  ],
  // A big monster shrugging off a hit.
  big: [
    "{name} still has {hp} hit points. Pack a lunch.",
    "{hp} hit points to go. This might take a while.",
    "{name} barely noticed that. {hp} hit points left."
  ],
  // The last monster standing goes down.
  victory: [
    "Victory! Every monster is down.",
    "Victory! Time to search the bodies.",
    "Victory! Every monster is down. Someone remember the short rest.",
    "Victory! The party lives to argue about the loot.",
    "Victory! Panai, your monsters fought bravely. And badly.",
    "Victory! Roll to see how long the celebration lasts.",
    "Victory! The bard is already writing the song."
  ],
  // Healed from 0 back on its feet.
  revive: [
    "{name} is back on its feet. The players will remember this, Panai.",
    "{name} rises again. Nobody at the table is happy about it.",
    "{name} is back from the dead. The cleric wants to know how.",
    "{name} gets back up. Round two, apparently."
  ],
  // Healing a monster that's already at full hit points.
  fullHeal: [
    "{name} is already at full health.",
    "{name} is at full health. Healing it more won't help, Panai.",
    "{name} can't get any healthier. It's already at full hit points.",
    "Full hit points already. {name} appreciates the thought."
  ],
  // Healing a monster (now and then).
  heal: [
    "Healing the monsters? The players saw that, Panai.",
    "{name} feels better. The party feels worse.",
    "A monster with a healer. How rude."
  ],
  // Long fights. A round is 6 seconds in the game.
  round5: [
    "Round 5. Thirty seconds have passed in the game.",
    "Round 5. The fight is warming up."
  ],
  round10: [
    "Round 10. One minute in the game. A lot longer at the table.",
    "Round 10. Spells that last 1 minute end about now."
  ],
  round20: [
    "Round 20. Two minutes in the game. Someone order food.",
    "Round 20. The monsters are getting tired too."
  ],
  roundLong: [
    "Round {round}. This is a long one, Panai.",
    "Round {round}. Legends will be told about this fight. Long ones.",
    "Round {round}. Has anyone checked if the players are still awake?"
  ],
  // Back on the very first turn.
  back: [
    "This is the very first turn. Time doesn't go back any further.",
    "Already at the start. Not even a Wish spell goes back past round 1.",
    "You're on the first turn. Before it there was only planning."
  ],
  // Reset.
  reset: [
    "{enc} is ready to run again.",
    "{enc} is ready to run again. The monsters remember nothing.",
    "{enc} is reset. Same monsters, fresh hit points, new hope.",
    "{enc} is ready again. The monsters feel strangely refreshed."
  ],
  // Deleting an encounter.
  deleted: [
    "{enc} is deleted. Its monsters are free to go home.",
    "{enc} is gone. The monsters in it never knew.",
    "{enc} is deleted."
  ],
  // The 10th, 20th and 50th monster in one encounter.
  many10: [
    "10 monsters. The party is going to love this.",
    "That's 10 monsters, Panai. Bold."
  ],
  many20: [
    "20 monsters. Are you sure the party has enough healing?",
    "20 monsters. The players are going to need a bigger table."
  ],
  many50: [
    "50 monsters. Panai, this is a war, not an encounter.",
    "50 monsters. Somewhere, the party's wizard just started crying."
  ]
};
