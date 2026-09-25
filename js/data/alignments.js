/* ---------------- Alignment data ---------------- */
export var ALIGNMENTS = {
  "Alignment": [
    "Lawful Good","Neutral Good","Chaotic Good",
    "Lawful Neutral","True Neutral","Chaotic Neutral",
    "Lawful Evil","Neutral Evil","Chaotic Evil"
  ]
};

export var ALIGNMENT_INFO = {
  "Lawful Good": "Acts with compassion, honor, and a strict sense of duty. Believes order and rules protect everyone.",
  "Neutral Good": "Devoted to helping others according to their needs, doing what is right without bias toward order or chaos.",
  "Chaotic Good": "Follows their conscience and values personal freedom, acting with kindness regardless of laws or traditions.",
  "Lawful Neutral": "Acts in accordance with law, tradition, or a personal code above all else. Reliable, orderly, and disciplined.",
  "True Neutral": "Prefers balance over extremes, acting naturally without strong dedication to good, evil, order, or chaos.",
  "Chaotic Neutral": "Values individual freedom above all else, following their own whims and avoiding restrictions or traditions.",
  "Lawful Evil": "Methodically takes what they want within the limits of a code of tradition, loyalty, or order.",
  "Neutral Evil": "Does whatever they can get away with for purely selfish gain, without compassion or remorse.",
  "Chaotic Evil": "Acts with arbitrary violence, driven by greed, hatred, or a lust for destruction."
};
export var ALIGNMENT_INFO_FALLBACK = "Pick an alignment that reflects your character's moral compass and personal philosophy.";

/* For the Compendium's Alignments tab: where each sits on the two axes,
   the kind of character it suits, and a tip for playing it well. */
export var ALIGNMENT_DETAILS = {
  "Lawful Good": {order:"Lawful", morality:"Good", examples:"Crusading knights, honest judges, dutiful city guards, most paladins.",
    tip:"Principled, not preachy: the interesting moments are when the law and doing good point in different directions."},
  "Neutral Good": {order:"Neutral", morality:"Good", examples:"Kind healers, helpful wanderers, loyal friends who do the right thing.",
    tip:"You help people because it's right, and you'll work with or around the rules depending on which does more good."},
  "Chaotic Good": {order:"Chaotic", morality:"Good", examples:"Rebels against tyrants, big-hearted outlaws, free-spirited heroes.",
    tip:"Good-hearted but allergic to being told what to do. Being kind isn't the same as being reckless."},
  "Lawful Neutral": {order:"Lawful", morality:"Neutral", examples:"Soldiers who follow orders, monks bound by a vow, impartial magistrates.",
    tip:"Your code comes first, good or bad. Decide what that code is, and what would make you break it."},
  "True Neutral": {order:"Neutral", morality:"Neutral", examples:"Druids keeping nature's balance, pragmatic mercenaries, people who just want a quiet life.",
    tip:"Not indecisive: you judge each situation on its own merits rather than by a grand principle."},
  "Chaotic Neutral": {order:"Chaotic", morality:"Neutral", examples:"Free-roaming tricksters, wanderers, rogues who live for the moment.",
    tip:"Independent, not random. The fun is in a character with their own goals, not one who disrupts the group for no reason."},
  "Lawful Evil": {order:"Lawful", morality:"Evil", examples:"Tyrants, scheming nobles, devils who keep the letter of every bargain.",
    tip:"Ruthless within your rules. Many tables don't allow evil characters, so check with your DM first."},
  "Neutral Evil": {order:"Neutral", morality:"Evil", examples:"Assassins for hire, selfish opportunists, anyone who looks out only for themselves.",
    tip:"Self-interest above all. Many tables don't allow evil characters, so check with your DM first."},
  "Chaotic Evil": {order:"Chaotic", morality:"Evil", examples:"Bloodthirsty raiders, demon cultists, destructive madmen.",
    tip:"Rarely a good fit for a party. Most tables don't allow it for player characters, so check with your DM first."}
};
