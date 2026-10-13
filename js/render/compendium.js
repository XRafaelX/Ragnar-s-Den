/* ---------------- Compendium ----------------
   A read-only reference (home screen) for classes, subclasses, races,
   backgrounds, feats, custom features, companions and alignments,
   in the same browse page as the Armory and Spellbook. Tapping an entry
   opens its details instead of adding it to anyone. The Subclasses tab's
   + makes a custom (homebrew) subclass: pick the class, name it and list
   its features with the level each is gained; it then shows up for
   characters in level-up and creation like any other. The Feats tab's +
   makes a custom feat or a custom feature, made here once and then given
   to any character (the sheet's buttons open it for that character).

   This file opens it; each tab lives in js/render/compendium/:
     shared.js                what all tabs share: the session, the detail
                              view's blocks, the edit and delete bar
     classes.js               Classes and Subclasses, the custom subclass form
     races-backgrounds.js     Races and Backgrounds, their homebrew forms
     feats.js                 Feats and custom features, "Add to <name>"
     companions-alignments.js Companions and Alignments */
import { openCatalogPicker, showCatalogCustomView } from "../ui/catalog-picker.js";
import { classSection, subclassSection } from "./compendium/classes.js";
import { companionSection, alignmentSection } from "./compendium/companions-alignments.js";
import { featSection } from "./compendium/feats.js";
import { raceSection, backgroundSection } from "./compendium/races-backgrounds.js";
import { session } from "./compendium/shared.js";


/* opts (all optional):
     create          "subclass" | "race" | "background" | "feat" | "feature":
                     open straight into that tab's custom form (from
                     level-up, the wizard, the feat picker or the sheet).
     tab             the same kinds: open on that tab's list instead.
     forClass        with create:"subclass", the class to pre-pick.
     onSaved         function(entry) called once after that form creates it.
     onClose         called when the Compendium is closed.
     forCharacter    a character, from its sheet: feats and custom features
                     offer "Add to <name>", and one created now is added to
                     it (then the Compendium closes, back to the sheet).
     edit            {kind:"feat"|"feature", id}: open that custom entry's
                     edit form (closes after saving).
     from            with create:"feat"/"feature", a copy already on
                     forCharacter (made before the Compendium kept them) to
                     pre-fill from; it's linked to the new entry.
   (newSubclassFor / onSubclassSaved are the older names for
    create:"subclass" + forClass / onSaved.) */
var CREATE_TAB = {subclass:1, race:2, background:3, feat:4, feature:4, companion:5};
export function openCompendium(opts){
  opts = opts || {};
  var create = opts.create || (opts.newSubclassFor ? "subclass" : null) || (opts.edit ? opts.edit.kind : null);
  session.giveTarget = opts.forCharacter || null;
  var sections = [classSection(), subclassSection(), raceSection(), backgroundSection(), featSection(), companionSection(), alignmentSection()];
  openCatalogPicker({
    sections:sections,
    initialSection: CREATE_TAB[create || opts.tab] || 0,
    onClose:function(){
      session.presetClass = null; session.savedHook = null; session.savedHookKind = null;
      session.giveTarget = null; session.formPreset = null;
      if(opts.onClose) opts.onClose();
    }
  });
  if(create){
    // Set after the picker's first build of the form, which would
    // otherwise use these up before the custom view is shown.
    session.presetClass = opts.forClass || opts.newSubclassFor || null;
    session.savedHook = opts.onSaved || opts.onSubclassSaved || null;
    session.savedHookKind = create;
    if(create==="feat" || create==="feature")
      session.formPreset = {kind:create, edit:opts.edit ? opts.edit.id : null, from:opts.from || null, direct:true};
    showCatalogCustomView();
  }
}
