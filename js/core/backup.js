/* ---------------- Backups ----------------
   A full backup holds every character plus all homebrew made in the
   Compendium. A character export holds only the chosen characters and
   the homebrew they use, so the file opens fully on another device
   without bringing along everything else. */

/* `lib` holds the full homebrew lists, keyed like a backup file
   (customSubclasses, customRaces, ...). Returns the same keys, each
   narrowed to the entries these characters use. Monsters and encounters
   belong to no character, so they are left out. */
export function homebrewForCharacters(chars, lib){
  function ids(listName, test){
    var out = {};
    chars.forEach(function(c){
      (c[listName]||[]).forEach(function(x){ if(x && x.homebrewId && (!test || test(x))) out[x.homebrewId] = true; });
    });
    return out;
  }
  function byId(list, used){ return (list||[]).filter(function(e){ return e && used[e.id]; }); }
  function byField(list, field){
    return (list||[]).filter(function(e){ return e && chars.some(function(c){ return c[field]===e.name; }); });
  }
  return {
    customSubclasses: (lib.customSubclasses||[]).filter(function(e){
      return e && chars.some(function(c){
        return (c.classes||[]).some(function(cl){ return cl.name===e.className && cl.subclass===e.name; });
      });
    }),
    customRaces: byField(lib.customRaces, "race"),
    customBackgrounds: byField(lib.customBackgrounds, "background"),
    customFeats: byId(lib.customFeats, ids("feats")),
    customFeatures: byId(lib.customFeatures, ids("features")),
    customWeapons: byId(lib.customWeapons, ids("inventory", function(i){ return i.type!=="armor"; })),
    customArmor: byId(lib.customArmor, ids("inventory", function(i){ return i.type==="armor"; })),
    customSpells: byId(lib.customSpells, ids("spells"))
  };
}
