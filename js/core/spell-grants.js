/* ---------------- Spells from features ----------------
   Spells a character gets without learning them: from class and subclass
   features, feats, invocations and fighting styles, plus the choices
   some features ask for. */
import { featDef, featSpellEntries, featCastAbility } from "./feat-picks.js";
import { invocationSpells } from "./invocations.js";
import { styleSpells } from "./fighting-styles.js";
import { pickedProfs } from "./class-picks.js";
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";
import { MARK_SPELLS, GUILD_SPELLS } from "../data/origin-spells.js";
import { mod, fmtMod, profBonus } from "./basics.js";
import { characterIsCaster, classCasterType, classSpellAbility, classFeatureList } from "./class-features.js";
import { coinAttackBonus } from "./magic-items.js";
import { infusionSpellAttack } from "./infusion-effects.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

/* The spellcasting abilities of the classes that cast spells now (a
   Paladin or Ranger from level 2, an Eldritch Knight or Arcane Trickster
   from 3), one entry per ability: [{ability, classes:[names], dc, attack}].
   A Cleric/Wizard has two; most characters one. */
export function spellcastingAbilities(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    var type = classCasterType(cl), ability = classSpellAbility(cl), lv = Number(cl.level)||1;
    if(!type || !ability || (type==="half" && lv < 2) || (type==="third" && lv < 3)) return;
    var entry = out.find(function(x){ return x.ability===ability; });
    if(!entry){
      var m = mod(abilityScore(c, ability));
      var focus = infusionSpellAttack(c);
      entry = {ability: ability, classes: [], dc: 8 + profBonus(c) + m, attack: profBonus(c) + m + coinAttackBonus(c) + (focus ? focus.value : 0)};
      out.push(entry);
    }
    entry.classes.push(cl.name);
  });
  return out;
}

/* Spells the character's class and subclass features grant, once each,
   in feature order: always prepared (Domain Spells), always known (Psionic
   Spells, bonus cantrips), added to the spellbook (Undead Thralls),
   ritual-only (Spirit Seeker), or cast without a slot: at will (Thousand
   Forms), free a few times (Visions of the Future) or for ki (Shadow
   Arts), with the feature's tag and tooltip. Worked out from the current features, not
   saved, so it follows level-ups and undo. `data` is the catalog entry. */
export function featureSpells(c){
  var out = [];
  (c.classes||[]).forEach(function(cl, idx){
    var lv = Number(cl.level)||1;
    classFeatureList(cl).forEach(function(f){
      var names = f.spells ? spellsUpTo(f.spells, lv) : [];
      var pick = f.spellChoice && (cl.spellChoices||{})[f.spellChoice.id];
      if(pick && f.spellChoice.options[pick]) names = names.concat(spellsUpTo(f.spellChoice.options[pick], lv));
      names.forEach(function(name){
        // A spell an earlier feature gives already (a Fey Wanderer's Misty
        // Step) takes this one's tag (Misty Wanderer's free casts).
        var had = out.find(function(x){ return x.name===name; });
        if(had){
          if(f.spellLabel){ had.kindLabel = f.spellLabel; had.tip = f.spellTip || ""; }
          return;
        }
        var data = SPELL_DATA[catalogSpellName(name)] || null;
        var fs = { name: name, data: data, level: data ? data.level : 0, kind: f.spellKind || "prepared",
          source: f.subclass ? cl.subclass : cl.name, feature: f.name, className: cl.name };
        if(f.spellLabel) fs.kindLabel = f.spellLabel;
        if(f.spellTip) fs.tip = f.spellTip;
        if(f.spellAbility) fs.note = spellAbilityNote(c, f.spellAbility, "").trim();
        out.push(fs);
      });
    });
    // Spells picked for a feature (an Arcana cleric's wizard cantrips, a
    // wizard's Signature Spells; see class-picks.js). One picked from the
    // spellbook only counts while the spell is still in it.
    pickedProfs(cl, idx > 0).spells.forEach(function(p){
      if(out.some(function(x){ return x.name===p.name; })) return;
      if(p.book && !(c.spells||[]).some(function(sp){ return sp.name===p.name; })) return;
      var data = SPELL_DATA[catalogSpellName(p.name)] || null;
      var fs = { name: p.name, data: data, level: data ? data.level : 0, kind: p.grant,
        source: p.subclass ? cl.subclass : cl.name, feature: p.feature, className: cl.name };
      if(p.kindLabel) fs.kindLabel = p.kindLabel;
      if(p.ability) fs.note = spellAbilityNote(c, p.ability, p.note || "A cantrip you always know from " + p.feature + ".");
      else if(p.note) fs.note = p.note;
      out.push(fs);
    });
  });
  // Feats that teach spells (Fey Touched: Misty Step and the picked
  // spell), cast with the ability the feat raised or names (Drow High
  // Magic: Charisma). A cantrip is simply known; the rest get a free
  // cast per rest, or are at will or ritual only.
  (c.feats||[]).forEach(function(feat){
    var def = featDef(feat.name);
    if(!def) return;
    var picks = feat.picks || {};
    var hasAbility = !!(def.castAbility || def.castAbilityByOption || (def.ability && def.ability.length));
    var ability = featCastAbility(c, def, picks);
    featSpellEntries(def, picks).forEach(function(e){
      if(out.some(function(x){ return x.name===e.name; })) return;
      var data = SPELL_DATA[catalogSpellName(e.name)] || null;
      var lead = FEAT_SPELL_LEADS[e.use];
      out.push({ name: e.name, data: data, level: data ? data.level : 0, kind: FEAT_SPELL_KINDS[e.use], source: feat.name, feature: feat.name,
        note: hasAbility ? spellAbilityNote(c, ability, lead) : lead, kindLabel: e.use==="short" ? "Free 1/short rest" : undefined });
    });
  });
  // The Pact Boon's and invocations' spells (Armor of Shadows' Mage Armor),
  // and Blessed / Druidic Warrior's cantrips.
  invocationSpells(c).concat(styleSpells(c)).forEach(function(fs){
    if(!out.some(function(x){ return x.name===fs.name; })) out.push(fs);
  });
  return out;
}
var FEAT_SPELL_KINDS = {long: "free", short: "free", once: "free", atwill: "atwill", ritual: "ritual", known: "known"};
var FEAT_SPELL_LEADS = {
  long: "Free once per long rest, or cast it with a spell slot.",
  short: "Free once per short or long rest, or cast it with a spell slot.",
  once: "Once per long rest at its lowest level, without a spell slot.",
  atwill: "At will, without a spell slot.",
  ritual: "Cast it as a ritual.",
  known: "A cantrip you always know from this feat."
};
/* Where the character already has this spell: "known" for one on the
   sheet, "from Fey Touched" (the granting feature's source) for a granted
   one, "" for neither. The pickers grey such a spell out with it. */
export function spellHeldBy(c, name){
  var key = function(n){ return catalogSpellName((n||"").trim()).toLowerCase(); };
  var want = key(name);
  if(!want) return "";
  if((c.spells||[]).some(function(sp){ return key(sp.name)===want; })) return "known";
  var fs = featureSpells(c).find(function(f){ return f.kind!=="expanded" && key(f.name)===want; });
  return fs ? "from " + fs.source : "";
}
/* "Uses Wisdom: save DC 13, spell attack +5." for a spell cast with
   `ability`, after `lead`. Without an ability yet, says where to pick it. */
export function spellAbilityNote(c, ability, lead){
  if(!ability) return lead + " Choose the feat's ability on the Features & Feats tab to see its save DC.";
  var m = mod(abilityScore(c, ability)), pb = profBonus(c);
  var name = {str:"Strength", dex:"Dexterity", con:"Constitution", int:"Intelligence", wis:"Wisdom", cha:"Charisma"}[ability];
  return lead + " Uses " + name + ": save DC " + (8 + pb + m) + ", spell attack " + fmtMod(pb + m) + ".";
}
/* A `spells` list: every name, or those keyed at or below class level `lv`. */
function spellsUpTo(spells, lv){
  if(Array.isArray(spells)) return spells;
  return Object.keys(spells).filter(function(k){ return Number(k) <= lv; })
    .reduce(function(a, k){ return a.concat(spells[k]); }, []);
}
/* Spell choices a class entry has at `level` (default: its own), with
   what's picked: [{feature, choice, pick}]. */
export function classSpellChoices(cl, level){
  return classFeatureList(cl, level).filter(function(f){ return f.spellChoice; }).map(function(f){
    return {feature: f.name, choice: f.spellChoice, pick: (cl.spellChoices||{})[f.spellChoice.id] || ""};
  });
}
/* Choices still to make, across classes: [{cl, feature, choice}]. */
export function pendingSpellChoices(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    classSpellChoices(cl).forEach(function(x){ if(!x.pick) out.push({cl: cl, feature: x.feature, choice: x.choice}); });
  });
  return out;
}
/* One option's spells as text: "Hold Person, Spike Growth (Druid 3);
   Sleet Storm, Slow (5); ..." (the class level each pair arrives at), or
   just the names for a flat list. */
export function spellOptionText(spells, className){
  if(Array.isArray(spells)) return spells.join(", ");
  return Object.keys(spells).map(function(k, i){ return spells[k].join(", ") + " (" + (i ? "" : (className || "level") + " ") + k + ")"; }).join("; ");
}
/* The spells a race's dragonmark (Spells of the Mark) or a Ravnica guild
   background (Guild Spells) adds to the list of every spellcasting class
   the character has: [{name, tag}] with catalog names. */
export function originListSpells(race, background){
  var out = [];
  [[MARK_SPELLS[race], "Mark spell"], [GUILD_SPELLS[background], "Guild spell"]].forEach(function(p){
    if(!p[0]) return;
    Object.keys(p[0]).forEach(function(lv){
      p[0][lv].forEach(function(n){ n = catalogSpellName(n); if(SPELL_DATA[n] && !out.some(function(o){ return o.name===n; })) out.push({name: n, tag: p[1]}); });
    });
  });
  return out;
}
/* Other classes' lists this class entry can learn spells from (a Divine
   Soul sorcerer: the cleric list). */
export function classExtraSpellLists(cl){
  var out = [];
  classFeatureList(cl).forEach(function(f){ if(f.extraSpellList && out.indexOf(f.extraSpellList)===-1) out.push(f.extraSpellList); });
  return out;
}
/* The Spells tab shows for casters, and for anyone a feature grants a
   spell (a Shadow monk's Minor Illusion). */
export function hasSpellsTab(c){
  return characterIsCaster(c) || featureSpells(c).length > 0;
}
