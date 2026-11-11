import { loadDungeons, findMap, dungeonOfMap, mapTitle, playerView } from "./dungeons.js";

/* ---------------- The players' screen ----------------
   The DM runs a dungeon in the app and the players watch it in a second
   tab (dungeon-view.html), usually dragged onto a TV. Both tabs are the
   same site in the same browser, so they talk without any server:

   - One map is "presented" at a time. When the DM steps to another map
     of the same dungeon, that one is presented instead and the players'
     screen follows. Its id is saved, so a players' tab that opens or
     reloads finds it on its own, even with the DM's tab closed.
   - The players' tab draws from the saved map at first, then listens:
     the DM's tab posts every change on a BroadcastChannel as it happens
     (even halfway through a drag), and saved changes arrive as storage
     events too, in case the channel missed one.
   - The players' tab only ever gets playerView(), the map holding what
     they were shown and nothing else. */

var CHANNEL = "ragnarsDen.dungeonView.v1";
var PRESENTED_KEY = "ragnarsDen.dungeonOnScreen.v1";
var DUNGEONS_KEY = "ragnarsDen.dungeons.v1";

var channel = null;
function getChannel(){
  if(!channel && typeof BroadcastChannel !== "undefined") channel = new BroadcastChannel(CHANNEL);
  return channel;
}
function post(msg){
  var ch = getChannel();
  if(ch) ch.postMessage(msg);
}

/* The players' map for a map: what they were shown, named after its
   dungeon (and the map, when the dungeon has several). */
function forPlayers(m){
  return playerView(m, mapTitle(dungeonOfMap(m.id), m));
}

/* ---- The DM's side ---- */

/* The id of the map on the players' screen, or null. */
export function presentedId(){
  try{ return localStorage.getItem(PRESENTED_KEY) || null; }catch(e){ return null; }
}

/* Puts this map on the players' screen. */
export function presentDungeon(d){
  try{ localStorage.setItem(PRESENTED_KEY, d.id); }catch(e){}
  publishDungeon(d);
}

/* Takes the map off the players' screen (it was deleted). `ids` is one
   map id or a list of them (a deleted dungeon's maps). */
export function stopPresenting(ids){
  if([].concat(ids).indexOf(presentedId()) === -1) return;
  try{ localStorage.removeItem(PRESENTED_KEY); }catch(e){}
  post({ type: "none" });
}

/* Sends the players the map as it is now, if it is the one they see. */
export function publishDungeon(d){
  if(d && d.id === presentedId()) post({ type: "map", map: forPlayers(d) });
}

/* Points at (x, y) on the players' screen, in squares (fractions
   allowed), if it shows this map. Returns false if it doesn't. A point is
   a passing gesture: it isn't saved. */
export function pointAt(d, x, y){
  if(!d || d.id !== presentedId()) return false;
  post({ type: "point", mapId: d.id, x: x, y: y });
  return true;
}

/* Any tab of the app answers a players' tab that has just opened, so it
   needn't wait for the next change. */
export function setupDungeonSync(){
  var ch = getChannel();
  if(!ch) return;
  ch.addEventListener("message", function(e){
    if(!e.data || e.data.type !== "hello") return;
    var m = findMap(presentedId());
    post(m ? { type: "map", map: forPlayers(m) } : { type: "none" });
  });
}

/* ---- The players' side ---- */

/* The players' map from what is saved, or null if none is presented. */
export function savedPlayerMap(){
  loadDungeons();
  var m = findMap(presentedId());
  return m ? forPlayers(m) : null;
}

/* Calls onMap(map or null) whenever the players' map changes, and
   onPoint({mapId, x, y}) when the DM points at something, and asks the
   DM's tab for the latest. */
export function watchAsPlayers(onMap, onPoint){
  var ch = getChannel();
  if(ch){
    ch.addEventListener("message", function(e){
      if(!e.data) return;
      if(e.data.type === "map" && e.data.map) onMap(e.data.map);
      else if(e.data.type === "none") onMap(null);
      else if(e.data.type === "point" && onPoint) onPoint(e.data);
    });
  }
  window.addEventListener("storage", function(e){
    if(e.key === DUNGEONS_KEY || e.key === PRESENTED_KEY || e.key === null) onMap(savedPlayerMap());
  });
  post({ type: "hello" });
}
