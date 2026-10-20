/* The Inventory tab's one-time offer of the background's starting
   equipment, for characters made before the creation wizard added it:
   "Add it" opens a sheet with the kit's choices and trinket rolls (the
   wizard's picker); "No thanks" puts it away for good. Either way it's
   recorded on c.backgroundGear and the card doesn't come back. */
import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { ce, escapeHtml, isProficientWithWeapon } from "../../core/helpers.js";
import { WEAPON_DATA } from "../../data/weapons.js";
import { backgroundProficiencies } from "../../core/class-picks.js";
import { backgroundKitOffered, addBackgroundKit, coinsText } from "../../core/background-gear.js";
import { renderKitPicker } from "../../ui/background-gear.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd } from "../../ui/sound.js";

export function renderBackgroundKitCard(c){
  if(!backgroundKitOffered(c)) return null;
  var card = makeCard("Background equipment");
  card.classList.add("bgk-offer");
  var p = ce("p", "bgk-offer-text");
  p.innerHTML = "Your <b>" + escapeHtml(c.background) + "</b> background comes with starting gear and coins.";
  card.appendChild(p);
  var actions = ce("div", "bgk-offer-actions");
  var add = ce("button", "btn small primary");
  add.type = "button"; add.textContent = "Add it";
  add.addEventListener("click", function(){ openKitSheet(c); });
  var no = ce("button", "btn small ghost");
  no.type = "button"; no.textContent = "No thanks";
  no.title = "You already have it, or don't want it. This card won't come back.";
  no.addEventListener("click", function(){
    c.backgroundGear = {background: c.background, dismissed: true};
    save(); renderAll();
  });
  actions.appendChild(add); actions.appendChild(no);
  card.appendChild(actions);
  return card;
}

function openKitSheet(c){
  var picks = {}, ctx = {toolPicks: backgroundProficiencies(c).tools};
  openBottomSheet(function(body, refresh, close){
    var header = ce("div", "bs-header");
    var title = ce("h3", "prep-title");
    title.textContent = c.background + " equipment";
    header.appendChild(title);
    var x = ce("button", "bs-close");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    header.appendChild(x);
    body.appendChild(header);
    body.appendChild(renderKitPicker(c.background, picks, ctx, "sheetKit", refresh));
    var actions = ce("div", "prep-actions");
    var cancel = ce("button", "btn small ghost");
    cancel.type = "button"; cancel.textContent = "Cancel";
    cancel.addEventListener("click", close);
    var go = ce("button", "btn small primary");
    go.type = "button"; go.textContent = "Add to inventory";
    go.addEventListener("click", function(){
      var res = addBackgroundKit(c, c.background, picks, ctx);
      // A weapon in the kit (a sailor's belaying pin): proficient or not.
      c.inventory.forEach(function(item){
        if(!item.picked) return;
        item.proficient = isProficientWithWeapon(c, item.name, (WEAPON_DATA[item.name] || {}).category);
        delete item.picked;
      });
      save(); close(); renderAll(); playAdd();
      showActionToast("Added " + res.items.length + " item" + (res.items.length === 1 ? "" : "s") + (coinsText(res.coins) ? " and " + coinsText(res.coins) : "") + ".");
    });
    actions.appendChild(cancel); actions.appendChild(go);
    body.appendChild(actions);
  });
}
