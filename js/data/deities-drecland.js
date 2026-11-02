/* ==================== PRIVATE: NOT FOR PUBLICATION ====================
   Michael Hobson's gods of Drecland, from his unpublished campaign book
   "Drecland Encyclopedia" (pre-art draft, chapter 7: Pantheons and
   Churches, the Gods table and each god's section). Shared with us for
   our own games only.
   Before the app goes live anywhere (a public site, a store), remove
   this file, its import and spread in js/data/deities.js, and the
   "Drecland gods" line in js/data/credits.js. The icons stay: they are
   game-icons.net (CC BY 3.0) and the other gods use them too.
   ====================================================================

   Same shape as DEITY_GROUPS in deities.js: each god is [text,
   alignment, suggested domains, holy symbol, icon].
   - Names and titles follow each god's section heading (it matches the
     book's contents) where the Gods table differs: Torvag "Legacy" not
     "Mountains", Skarn "the Enduring" not "Endurance", Vaatniδ "the
     Oceans" not "the Sea", Lumina "Light and Hope" not "Light", Lyzara
     "adventure and thrill" (her section says both).
   - Pantheon and alignment from the Gods table. "G" is the book's own
     plain Good (the Prime Gods Sorilios, Lunares, Animos); Fresi's "TN"
     is stored as plain Neutral.
   - The book suggests no cleric domains, so none are listed.
   - Holy symbols from the Gods table; Cognus, Fresi (her section: no
     holy symbol), Toppleguff and Vaatniδ have none, so their icons are
     our choice (natural law, a broken chain, a tower, a leviathan). */

export var DRECLAND_GROUPS = [
  {label: "Drecland: Pantheon of the Sun", gods: [
    ["Arakthar, the Auric Dragon (honour and pride)", "LG", "", "A claw wrapped around a balanced scale", "lorc/scales"],
    ["Helios, god of protection", "LG", "", "A kite-shaped shield bearing a closed helm", "delapouite/black-knight-helm"],
    ["Ladav, god of sex and romance", "CN", "", "A feathered heart", "delapouite/heart-wings"],
    ["Liorael, god of magic", "LG", "", "An opened tome", "delapouite/spell-book"],
    ["Lumina, goddess of light and hope", "CG", "", "A sunburst with slender rays", "lorc/sunbeams"],
    ["Sorilios, god of the sun", "G", "", "A sunburst", "caro-asercion/heraldic-sun"],
    ["Valmir, god of valour", "LG", "", "An upright sword", "lorc/broadsword"],
    ["Virelia, goddess of health", "NG", "", "A serpent coiled around a lotus", "delapouite/caduceus"]
  ]},
  {label: "Drecland: Pantheon of the Moon", gods: [
    ["Ceresia, goddess of harvest", "NG", "", "A sheaf of wheat tied with a ribbon", "lorc/wheat"],
    ["Fresi, goddess of freedom", "N", "", "", "skoll/breaking-chain"],
    ["Lunares, goddess of the moon", "G", "", "A crescent moon", "lorc/moon"],
    ["Neptune, goddess of the sea", "NG", "", "A calm wave curling gently around a full moon", "lorc/wave-crest"],
    ["Ulfrun, god of the hunt", "LN", "", "A wolf's head silhouette with sharp eyes", "lorc/wolf-head"],
    ["Vhaelor, god of shadows", "LE", "", "A dagger entwined in a serpent", "lorc/plain-dagger"]
  ]},
  {label: "Drecland: Pantheon of the Soul", gods: [
    ["Andovar, god of hearth", "CG", "", "A lantern with a glowing flame inside", "lorc/lantern-flame"],
    ["Animos, god of the soul", "G", "", "A constellation shaped like an open eye", "lorc/templar-eye"],
    ["Aretama, goddess of tranquillity", "LN", "", "Waves on water", "lorc/waves"],
    ["Lyzara, goddess of adventure and thrill", "CN", "", "A lantern with a small star shining inside", "lorc/lantern"],
    ["Skarn, god of the enduring", "LN", "", "A jagged mountain peak", "lorc/peaks"],
    ["Sylvara, goddess of nature", "LN", "", "Four falling leaves", "lorc/falling-leaf"],
    ["Toppleguff, god of towers", "CN", "", "", "lorc/white-tower"]
  ]},
  {label: "Drecland: Pantheon of the Know", gods: [
    ["Cognus, Divine Law", "N", "", "", "lorc/orbital"],
    ["Dornn, god of the forge", "LN", "", "A heavy hammer striking an anvil", "lorc/anvil-impact"],
    ["Euqid, god of contracts", "LN", "", "An unfolded scroll with a feather", "delapouite/scroll-quill"],
    ["Tinktril, god of invention", "CN", "", "Two gears with bright sparks flying between them", "lorc/gears"],
    ["Torvag, the Stone Father (legacy)", "CN", "", "A bearded pickaxe", "delapouite/war-pick"],
    ["Vespera, goddess of secrets", "LE", "", "An open book with a weaving thread forming a constellation above it", "lorc/book-aura"]
  ]},
  {label: "Drecland: Soul and Know", gods: [
    ["Fateful Twins, gods of duality", "LN", "", "Two mirrored humanoid silhouettes leaning backward", "lorc/two-shadows"]
  ]},
  {label: "Drecland: Without a pantheon", gods: [
    ["Vaatniδ, god of the oceans", "CE", "", "", "delapouite/kraken-tentacle"]
  ]}
];
