/* ---------------- Eldritch invocations and Pact Boons ----------------
   The warlock's invocations from the Player's Handbook, Xanathar's Guide
   and Tasha's Cauldron (2014 rules). Each entry:
     name, source ("PHB", "XGE", "TCE"), text (the rules text, trimmed)
     level      warlock level needed (none: from level 2)
     pact       Pact Boon needed ("Pact of the Blade", ...)
     needs      "eldritchBlast": knowing the Eldritch Blast cantrip;
                "hex": the hex spell or a warlock feature that curses
                (Hexblade's Curse, Sign of Ill Omen)
     spells     [{name, kind}]: spells it lets you cast. kind "atwill"
                (no slot), "free" (once per long rest without a slot) or
                "slot" (once per long rest, using a warlock spell slot).
                They show on the Spells tab; free and slot casts also get
                a use on the Vitals tab.
     uses       {max: "1" or "pb", reset: "short"/"long", name}: a use
                that isn't a spell (Tomb of Levistus), on the Vitals tab
     skills     skill proficiencies it grants (Beguiling Influence)
     speeds     like class features' (Gift of the Depths: swim = walk)
     spellPick  {count, level, ritual, label}: spells to choose from any
                class's list (Book of Ancient Secrets' two rituals)
     blast      what it adds to Eldritch Blast, for the card's summary:
                {damage: true} (+CHA), {range: 300}, {rider: "..."}
     optional   one of Tasha's optional class features (all of Tasha's
                invocations and Pact of the Talisman): offered only to a
                character using them (c.tashaOptional)
     sight      a sense shown with the character's senses ("Devil's Sight 120 ft")
   Anything else an invocation does stays as its text on the card. */
export var INVOCATIONS = [
  /* ---- Player's Handbook ---- */
  {name:"Agonizing Blast", source:"PHB", needs:"eldritchBlast", blast:{damage:true},
    text:"When you cast eldritch blast, add your Charisma modifier to the damage it deals on a hit."},
  {name:"Armor of Shadows", source:"PHB", spells:[{name:"Mage Armor", kind:"atwill"}],
    text:"You can cast mage armor on yourself at will, without expending a spell slot or material components."},
  {name:"Ascendant Step", source:"PHB", level:9, spells:[{name:"Levitate", kind:"atwill"}],
    text:"You can cast levitate on yourself at will, without expending a spell slot or material components."},
  {name:"Beast Speech", source:"PHB", spells:[{name:"Speak with Animals", kind:"atwill"}],
    text:"You can cast speak with animals at will, without expending a spell slot."},
  {name:"Beguiling Influence", source:"PHB", skills:["Deception","Persuasion"],
    text:"You gain proficiency in the Deception and Persuasion skills."},
  {name:"Bewitching Whispers", source:"PHB", level:7, spells:[{name:"Compulsion", kind:"slot"}],
    text:"You can cast compulsion once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Book of Ancient Secrets", source:"PHB", pact:"Pact of the Tome", spellPick:{count:2, level:1, ritual:true, label:"1st-level ritual spells from any class"},
    text:"You can inscribe magical rituals in your Book of Shadows. Choose two 1st-level spells that have the ritual tag from any class's spell list. They appear in the book and don't count against your spells known. With your Book of Shadows in hand, you can cast them as rituals (and only as rituals, unless you learned them another way). You can also cast a warlock spell you know as a ritual if it has the ritual tag. On your adventures you can add other ritual spells to the book, if the spell's level is at most half your warlock level (rounded up): 2 hours and 50 gp of rare inks per spell level."},
  {name:"Chains of Carceri", source:"PHB", level:15, pact:"Pact of the Chain", spells:[{name:"Hold Monster", kind:"atwill"}],
    text:"You can cast hold monster at will, targeting a celestial, fiend, or elemental, without expending a spell slot or material components. You must finish a long rest before you can use this invocation on the same creature again."},
  {name:"Devil's Sight", source:"PHB", sight:"Devil's Sight 120 ft",
    text:"You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet."},
  {name:"Dreadful Word", source:"PHB", level:7, spells:[{name:"Confusion", kind:"slot"}],
    text:"You can cast confusion once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Eldritch Sight", source:"PHB", spells:[{name:"Detect Magic", kind:"atwill"}],
    text:"You can cast detect magic at will, without expending a spell slot."},
  {name:"Eldritch Spear", source:"PHB", needs:"eldritchBlast", blast:{range:300},
    text:"When you cast eldritch blast, its range is 300 feet."},
  {name:"Eyes of the Rune Keeper", source:"PHB",
    text:"You can read all writing."},
  {name:"Fiendish Vigor", source:"PHB", spells:[{name:"False Life", kind:"atwill"}],
    text:"You can cast false life on yourself at will as a 1st-level spell, without expending a spell slot or material components."},
  {name:"Gaze of Two Minds", source:"PHB",
    text:"You can use your action to touch a willing humanoid and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can use your action on later turns to keep the connection, extending it until the end of your next turn. While perceiving through its senses, you benefit from any special senses it has, and you are blinded and deafened to your own surroundings."},
  {name:"Lifedrinker", source:"PHB", level:12, pact:"Pact of the Blade",
    text:"When you hit a creature with your pact weapon, the creature takes extra necrotic damage equal to your Charisma modifier (minimum 1)."},
  {name:"Mask of Many Faces", source:"PHB", spells:[{name:"Disguise Self", kind:"atwill"}],
    text:"You can cast disguise self at will, without expending a spell slot."},
  {name:"Master of Myriad Forms", source:"PHB", level:15, spells:[{name:"Alter Self", kind:"atwill"}],
    text:"You can cast alter self at will, without expending a spell slot."},
  {name:"Minions of Chaos", source:"PHB", level:9, spells:[{name:"Conjure Elemental", kind:"slot"}],
    text:"You can cast conjure elemental once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Mire the Mind", source:"PHB", level:5, spells:[{name:"Slow", kind:"slot"}],
    text:"You can cast slow once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Misty Visions", source:"PHB", spells:[{name:"Silent Image", kind:"atwill"}],
    text:"You can cast silent image at will, without expending a spell slot or material components."},
  {name:"One with Shadows", source:"PHB", level:5,
    text:"When you are in an area of dim light or darkness, you can use your action to become invisible until you move or take an action or a reaction."},
  {name:"Otherworldly Leap", source:"PHB", level:9, spells:[{name:"Jump", kind:"atwill"}],
    text:"You can cast jump on yourself at will, without expending a spell slot or material components."},
  {name:"Repelling Blast", source:"PHB", needs:"eldritchBlast", blast:{rider:"push 10 ft"},
    text:"When you hit a creature with eldritch blast, you can push the creature up to 10 feet away from you in a straight line."},
  {name:"Sculptor of Flesh", source:"PHB", level:7, spells:[{name:"Polymorph", kind:"slot"}],
    text:"You can cast polymorph once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Sign of Ill Omen", source:"PHB", level:5, spells:[{name:"Bestow Curse", kind:"slot"}],
    text:"You can cast bestow curse once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Thief of Five Fates", source:"PHB", spells:[{name:"Bane", kind:"slot"}],
    text:"You can cast bane once using a warlock spell slot. You can't do so again until you finish a long rest."},
  {name:"Thirsting Blade", source:"PHB", level:5, pact:"Pact of the Blade",
    text:"You can attack with your pact weapon twice, instead of once, whenever you take the Attack action on your turn."},
  {name:"Visions of Distant Realms", source:"PHB", level:15, spells:[{name:"Arcane Eye", kind:"atwill"}],
    text:"You can cast arcane eye at will, without expending a spell slot."},
  {name:"Voice of the Chain Master", source:"PHB", pact:"Pact of the Chain",
    text:"You can communicate telepathically with your familiar and perceive through its senses as long as you are on the same plane of existence. While perceiving through its senses, you can also speak through your familiar in your own voice, even if it normally can't speak."},
  {name:"Whispers of the Grave", source:"PHB", level:9, spells:[{name:"Speak with Dead", kind:"atwill"}],
    text:"You can cast speak with dead at will, without expending a spell slot."},
  {name:"Witch Sight", source:"PHB", level:15, sight:"Witch Sight 30 ft",
    text:"You can see the true form of any shapechanger or creature concealed by illusion or transmutation magic while the creature is within 30 feet of you and within line of sight."},

  /* ---- Xanathar's Guide to Everything ---- */
  {name:"Aspect of the Moon", source:"XGE", pact:"Pact of the Tome",
    text:"You no longer need to sleep and can't be forced to sleep by any means. To gain the benefits of a long rest, you can spend all 8 hours doing light activity, such as reading your Book of Shadows and keeping watch."},
  {name:"Cloak of Flies", source:"XGE", level:5, uses:{max:"1", reset:"short"},
    text:"As a bonus action, you surround yourself with a magical aura of buzzing flies that extends 5 feet from you (not through total cover), until you're incapacitated or dismiss it as a bonus action. It gives you advantage on Charisma (Intimidation) checks but disadvantage on all other Charisma checks. Any other creature that starts its turn in the aura takes poison damage equal to your Charisma modifier (minimum 0). Once per short or long rest."},
  {name:"Eldritch Smite", source:"XGE", level:5, pact:"Pact of the Blade",
    text:"Once per turn when you hit a creature with your pact weapon, you can expend a warlock spell slot to deal an extra 1d8 force damage to the target, plus another 1d8 per level of the spell, and you can knock the target prone if it is Huge or smaller."},
  {name:"Ghostly Gaze", source:"XGE", level:7, uses:{max:"1", reset:"short"},
    text:"As an action, you can see through solid objects to a range of 30 feet, and within that range you have darkvision if you don't already. This lasts for 1 minute or until your concentration ends (as if concentrating on a spell); objects look like ghostly, transparent images. Once per short or long rest."},
  {name:"Gift of the Depths", source:"XGE", level:5, speeds:[{type:"swim", value:"walk"}], spells:[{name:"Water Breathing", kind:"free"}],
    text:"You can breathe underwater, and you gain a swimming speed equal to your walking speed. You can also cast water breathing once without expending a spell slot, regaining the ability when you finish a long rest."},
  {name:"Gift of the Ever-Living Ones", source:"XGE", pact:"Pact of the Chain",
    text:"Whenever you regain hit points while your familiar is within 100 feet of you, treat any dice rolled to determine the hit points you regain as having rolled their maximum value for you."},
  {name:"Grasp of Hadar", source:"XGE", needs:"eldritchBlast", blast:{rider:"pull 10 ft (once per turn)"},
    text:"Once on each of your turns when you hit a creature with your eldritch blast, you can move that creature in a straight line 10 feet closer to you."},
  {name:"Improved Pact Weapon", source:"XGE", pact:"Pact of the Blade",
    text:"You can use any weapon you summon with Pact of the Blade as a spellcasting focus for your warlock spells. The weapon gains a +1 bonus to its attack and damage rolls, unless it is a magic weapon that already has a bonus to those rolls. The weapon you conjure can also be a shortbow, longbow, light crossbow, or heavy crossbow."},
  {name:"Lance of Lethargy", source:"XGE", needs:"eldritchBlast", blast:{rider:"-10 ft speed (once per turn)"},
    text:"Once on each of your turns when you hit a creature with your eldritch blast, you can reduce that creature's speed by 10 feet until the end of your next turn."},
  {name:"Maddening Hex", source:"XGE", level:5, needs:"hex",
    text:"As a bonus action, you cause a psychic disturbance around the target cursed by your hex spell or by a warlock feature of yours, such as Hexblade's Curse or Sign of Ill Omen. The cursed target and each creature of your choice you can see within 5 feet of it take psychic damage equal to your Charisma modifier (minimum 1). You must be able to see the cursed target, and it must be within 30 feet of you."},
  {name:"Relentless Hex", source:"XGE", level:7, needs:"hex",
    text:"As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see within 5 feet of the target cursed by your hex spell or by a warlock feature of yours, such as Hexblade's Curse or Sign of Ill Omen. You must be able to see the cursed target."},
  {name:"Shroud of Shadow", source:"XGE", level:15, spells:[{name:"Invisibility", kind:"atwill"}],
    text:"You can cast invisibility at will, without expending a spell slot."},
  {name:"Tomb of Levistus", source:"XGE", level:5, uses:{max:"1", reset:"short"},
    text:"As a reaction when you take damage, you can entomb yourself in ice, which melts away at the end of your next turn. You gain 10 temporary hit points per warlock level, which take as much of the triggering damage as possible. Right after you take the damage, you gain vulnerability to fire damage, your speed is 0, and you are incapacitated. These effects, and any temporary hit points left, end when the ice melts. Once per short or long rest."},
  {name:"Trickster's Escape", source:"XGE", level:7, spells:[{name:"Freedom of Movement", kind:"free"}],
    text:"You can cast freedom of movement once on yourself without expending a spell slot. You regain the ability to do so when you finish a long rest."},

  /* ---- Tasha's Cauldron of Everything ---- */
  {name:"Bond of the Talisman", source:"TCE", optional:true, level:12, pact:"Pact of the Talisman", uses:{max:"pb", reset:"long", name:"Talisman teleports"},
    text:"While someone else is wearing your talisman, you can use your action to teleport to the unoccupied space closest to them, provided you're on the same plane of existence. The wearer can do the same, using their action to teleport to you. The teleportation can be used a number of times equal to your proficiency bonus, regained when you finish a long rest."},
  {name:"Eldritch Mind", source:"TCE", optional:true,
    text:"You have advantage on Constitution saving throws that you make to maintain your concentration on a spell."},
  {name:"Far Scribe", source:"TCE", optional:true, level:5, pact:"Pact of the Tome", spells:[{name:"Sending", kind:"atwill"}],
    text:"A new page appears in your Book of Shadows. With your permission, a creature can use its action to write its name on it; the page holds a number of names equal to your proficiency bonus. You can cast sending, targeting a creature whose name is on the page, without a spell slot or material components: you write the message on the page, and any reply appears there. The writing disappears after 1 minute. As an action, you can erase a name by touching it."},
  {name:"Gift of the Protectors", source:"TCE", optional:true, level:9, pact:"Pact of the Tome", uses:{max:"1", reset:"long", name:"Gift of the Protectors"},
    text:"A new page appears in your Book of Shadows. With your permission, a creature can use its action to write its name on it; the page holds a number of names equal to your proficiency bonus. When any creature whose name is on the page is reduced to 0 hit points but not killed outright, it drops to 1 hit point instead. Once this triggers, no creature can benefit from it until you finish a long rest. As an action, you can erase a name by touching it."},
  {name:"Investment of the Chain Master", source:"TCE", optional:true, pact:"Pact of the Chain",
    text:"When you cast find familiar, the familiar gains a flying or swimming speed (your choice) of 40 feet. As a bonus action, you can command it to take the Attack action. Its weapon attacks count as magical for overcoming resistance and immunity, and any saving throw it forces uses your spell save DC. When it takes damage, you can use your reaction to give it resistance to that damage."},
  {name:"Protection of the Talisman", source:"TCE", optional:true, level:7, pact:"Pact of the Talisman", uses:{max:"pb", reset:"long", name:"Talisman save d4"},
    text:"When the wearer of your talisman fails a saving throw, they can add a d4 to the roll, potentially turning the save into a success. This can be used a number of times equal to your proficiency bonus, regained when you finish a long rest."},
  {name:"Rebuke of the Talisman", source:"TCE", optional:true, pact:"Pact of the Talisman",
    text:"When the wearer of your talisman is hit by an attacker you can see within 30 feet of you, you can use your reaction to deal psychic damage to the attacker equal to your proficiency bonus and push it up to 10 feet away from the talisman's wearer."},
  {name:"Undying Servitude", source:"TCE", optional:true, level:5, spells:[{name:"Animate Dead", kind:"free"}],
    text:"You can cast animate dead without using a spell slot. Once you do so, you can't cast it in this way again until you finish a long rest."}
];

/* The Pact Boon at warlock level 3 (Tasha's adds the Talisman). Shaped
   like an invocation for spells, picks and uses. */
export var PACT_BOONS = [
  {name:"Pact of the Blade", source:"PHB",
    summary:"Summon a magic melee weapon of any kind as an action; you're proficient with it.",
    text:"You can use your action to create a pact weapon in your empty hand, in any melee weapon form you choose each time. You are proficient with it while you wield it, and it counts as magical for overcoming resistance and immunity to nonmagical attacks and damage. It disappears if it's more than 5 feet from you for 1 minute, if you use this feature again, if you dismiss it (no action required) or if you die. With a 1-hour ritual you can bond a magic weapon to be your pact weapon instead, summoning it as an action."},
  {name:"Pact of the Chain", source:"PHB", spells:[{name:"Find Familiar", kind:"known", note:"You can cast it as a ritual. It doesn't count against your spells known."}],
    summary:"Learn Find Familiar, with special forms (imp, pseudodragon, quasit, sprite).",
    text:"You learn the find familiar spell and can cast it as a ritual; it doesn't count against your spells known. Your familiar can take one of the normal forms or a special one: imp, pseudodragon, quasit, or sprite. When you take the Attack action, you can forgo one of your own attacks to let your familiar use its reaction to make one attack of its own."},
  {name:"Pact of the Tome", source:"PHB", spellPick:{count:3, level:0, label:"cantrips from any class"},
    summary:"A Book of Shadows with three cantrips from any class's spell list.",
    text:"Your patron gives you a grimoire called a Book of Shadows. Choose three cantrips from any class's spell list. While the book is on your person, you can cast them at will; they don't count against your cantrips known and are warlock spells for you. If you lose the book, a 1-hour ceremony gets you a replacement (and destroys the old one)."},
  {name:"Pact of the Talisman", source:"TCE", optional:true, uses:{max:"pb", reset:"long", name:"Talisman d4"},
    summary:"An amulet whose wearer can add a d4 to a failed ability check.",
    text:"Your patron gives you an amulet. When its wearer fails an ability check, they can add a d4 to the roll, potentially turning it into a success. This can be used a number of times equal to your proficiency bonus, regained when you finish a long rest. If you lose the talisman, a 1-hour ceremony gets you a replacement (and destroys the old one)."}
];

export var INVOCATION_SOURCES = {PHB:"Player's Handbook", XGE:"Xanathar's Guide", TCE:"Tasha's Cauldron"};

/* Invocations known at each warlock level (index = level). */
var KNOWN = [0,0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8];
export function invocationsKnownAt(level){ return KNOWN[Math.max(0, Math.min(20, Number(level)||0))]; }

export function invocationDef(name){ return INVOCATIONS.find(function(i){ return i.name===name; }) || null; }
export function pactBoonDef(name){ return PACT_BOONS.find(function(p){ return p.name===name; }) || null; }
